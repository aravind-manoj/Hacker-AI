import os
import time
import queue
import threading
from typing import Annotated
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool, InjectedToolArg
from langchain_core.messages import trim_messages
from context_manager import ContextManager
from langgraph.checkpoint.memory import InMemorySaver
from docker_controller import Controller
from prompts import SUB_AGENT_PROMPT
from db_manager import DBManager
from logger import log_info, log_warn, log_error, log_debug

@tool("execute_command")
def execute_command(
  command: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Execute a shell command in the Docker container.

  Args:
    command: The shell command to execute
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("Sub-agent stopped")
    controller: Controller = config["configurable"]["controller"]
    controller.send_command(command)
    config["configurable"].get("stop_event", threading.Event()).wait(1.0)
    log_info(f"Command: {command}", agent_id=controller.tag)
    return f"Command sent: {command}"
  except InterruptedError:
    raise
  except Exception as e:
    return f"Error executing command: {str(e)}"


@tool("read_terminal")
def read_terminal(
  last_chars: int = 5000,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Read the recent terminal output from the Docker container.
  Use this to check command results and monitor progress.

  IMPORTANT: If you call this tool twice in a row and the output is identical
  both times, the terminal has not changed. In that case you MUST call the
  `wait_for_output` tool to avoid busy-waiting, and then read again.

  Args:
    last_chars: Number of characters to read from the end of the buffer (min 2000, default 5000)
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("Sub-agent stopped")
    controller: Controller = config["configurable"]["controller"]
    terminal_tracker: TerminalTracker = config["configurable"]["terminal_tracker"]
    screen = controller.get_screen(last_chars)
    is_stale = terminal_tracker.update(screen)

    log_info(f"Terminal read ({len(screen)} chars): {screen}", agent_id=controller.tag)

    result = f"--- Terminal Output ---\n{screen}"
    if is_stale:
      result += "\n\nNOTE: Terminal output is IDENTICAL to your previous read. The command may still be running. You MUST call `wait_for_output` before reading again."
    return result
  except Exception as e:
    return f"Error reading terminal: {str(e)}"


@tool("wait_for_output")
def wait_for_output(
  seconds: int = 10,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Wait/sleep for a specified number of seconds before reading the terminal again.
  Use this when the terminal output hasn't changed between consecutive reads,
  indicating a long-running command is still in progress.
  Before calling this tool, you must call `read_terminal` tool to check for new output.

  Args:
    seconds: Number of seconds to wait (5-30, default 10)
  """
  seconds = max(5, min(60, seconds))
  tag = config["configurable"]["controller"].tag if config else "unknown"
  log_info(f"Waiting {seconds}s for output", agent_id=tag)
  
  stop_event = config["configurable"].get("stop_event", threading.Event())
  stop_event.wait(seconds)
  if stop_event.is_set():
    raise InterruptedError("Sub-agent stopped")
  
  return f"Waited {seconds} seconds. You can now read the terminal again to check for new output."


# Key name → actual escape sequence mapping
_KEY_MAP = {
  "enter":     "\n",
  "return":    "\n",
  "tab":       "\t",
  "backspace": "\x7f",
  "escape":    "\x1b",
  "esc":       "\x1b",
  "ctrl+c":    "\x03",
  "ctrl+d":    "\x04",
  "ctrl+z":    "\x1a",
  "ctrl+l":    "\x0c",
  "ctrl+a":    "\x01",
  "ctrl+e":    "\x05",
  "ctrl+u":    "\x15",
  "ctrl+k":    "\x0b",
  "ctrl+w":    "\x17",
  "up":        "\x1b[A",
  "down":      "\x1b[B",
  "right":     "\x1b[C",
  "left":      "\x1b[D",
  "space":     " ",
}


def _translate_keys(raw: str) -> str:
  """Translate human-readable key names into actual terminal sequences.

  Supports formats like:
    "y"           → sends 'y'
    "Enter"       → sends '\\n'
    "8 Enter"     → sends '8\\n'
    "Ctrl+C"      → sends \\x03
    "y Enter"     → sends 'y\\n'

  Keys can be separated by spaces. Single characters are sent as-is.
  Multi-character tokens are looked up in the key map.
  """
  tokens = raw.split()
  result = []
  for token in tokens:
    mapped = _KEY_MAP.get(token.lower())
    if mapped:
      result.append(mapped)
    elif len(token) == 1:
      # Single character — send as-is
      result.append(token)
    else:
      # Unknown multi-char token — could be a typed word, send as-is
      result.append(token)
  return "".join(result)


@tool("send_keys")
def send_keys(
  keys: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Send keystrokes to the terminal. Supports human-readable key names.

  Examples:
    - send_keys("y Enter")       → types 'y' then presses Enter
    - send_keys("8 Enter")       → types '8' then presses Enter
    - send_keys("Ctrl+C")        → sends Ctrl+C interrupt
    - send_keys("Enter")         → presses Enter
    - send_keys("Y Enter")       → types 'Y' then presses Enter

  Supported special keys: Enter, Tab, Backspace, Escape, Ctrl+C, Ctrl+D,
  Ctrl+Z, Ctrl+L, Ctrl+A, Ctrl+E, Ctrl+U, Up, Down, Left, Right, Space

  Args:
    keys: Space-separated key names or characters to send
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("Sub-agent stopped")
    controller: Controller = config["configurable"]["controller"]
    translated = _translate_keys(keys)
    controller.send_keys(translated)
    log_info(f"Keys: {repr(keys)} → {repr(translated)}", agent_id=controller.tag)
    return f"Keys sent: {repr(keys)} (translated to {repr(translated)})"
  except Exception as e:
    return f"Error sending keys: {str(e)}"


@tool("check_messages")
def check_messages(
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Check for new messages or instructions from the main agent."""
  if config["configurable"].get("stop_event", threading.Event()).is_set():
    raise InterruptedError("Sub-agent stopped")
  msg_queue: queue.Queue = config["configurable"]["messages"]
  messages = []
  while not msg_queue.empty():
    try:
      messages.append(msg_queue.get_nowait())
    except queue.Empty:
      break
  if messages:
    return "Messages from main agent:\n" + "\n".join(f"  - {m}" for m in messages)
  return "No new messages from the main agent."


@tool("mark_step_completed")
def mark_step_completed(
  step_description: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Mark a step as completed. Call this after you finish each step of your task.
  This helps the main agent track your progress and make decisions.

  Args:
    step_description: A concise description of what was completed (e.g., "Installed nmap and nikto", "Completed port scan on 192.168.1.1")
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("Sub-agent stopped")
    state: dict = config["configurable"]["state"]
    subagent_id: str = config["configurable"]["subagent_id"]

    if "completed_steps" not in state:
      state["completed_steps"] = []
    state["completed_steps"].append(step_description)

    # Update database
    try:
      db = DBManager()
      db.append_completed_step(subagent_id, step_description)
    except Exception as e:
      log_warn(f"Failed to persist completed step to DB: {e}", agent_id=subagent_id)

    log_info(f"Step completed: {step_description}", agent_id=subagent_id)
    return f"Step marked as completed: {step_description}"
  except Exception as e:
    return f"Error marking step: {str(e)}"


@tool("report_finding")
def report_finding(
  finding: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Report a finding discovered during your task. Call this whenever you discover
  something noteworthy — a vulnerability, an open port, a misconfiguration, leaked
  credentials, etc. You can call this multiple times as you discover things.

  The main agent will use these findings to compile the final report.

  Args:
    finding: A detailed description of the finding (e.g., "Port 22 (SSH) is open with OpenSSH 8.2", "SQL injection found in /login endpoint")
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("Sub-agent stopped")
    state: dict = config["configurable"]["state"]
    subagent_id: str = config["configurable"]["subagent_id"]

    if "findings" not in state:
      state["findings"] = []
    state["findings"].append(finding)

    # Update database
    try:
      db = DBManager()
      db.append_finding(subagent_id, finding)
    except Exception as e:
      log_warn(f"Failed to persist finding to DB: {e}", agent_id=subagent_id)

    log_info(f"Finding reported: {finding}", agent_id=subagent_id)
    return f"Finding recorded: {finding}"
  except Exception as e:
    return f"Error reporting finding: {str(e)}"


@tool("report_to_main")
def report_to_main(
  summary: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Signal that your task is complete by providing a final summary.
  Make sure you have already reported all individual findings using `report_finding`
  and marked all steps using `mark_step_completed` before calling this.

  Args:
    summary: A brief summary of what was accomplished and key highlights
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("Sub-agent stopped")
    state: dict = config["configurable"]["state"]
    state["summary"] = summary
    state["status"] = "completed"

    return "Task completion reported to main agent. Your task is now complete."
  except Exception as e:
    return f"Error reporting to main: {str(e)}"


SUB_AGENT_TOOLS = [
  execute_command,
  read_terminal,
  wait_for_output,
  send_keys,
  check_messages,
  mark_step_completed,
  report_finding,
  report_to_main,
]

class TerminalTracker:
  def __init__(self):
    self._last_snapshot: str = ""
    self._consecutive_stale: int = 0

  def update(self, current_screen: str) -> bool:
    if current_screen == self._last_snapshot:
      self._consecutive_stale += 1
      return self._consecutive_stale >= 2  # stale after 2 identical reads
    else:
      self._last_snapshot = current_screen
      self._consecutive_stale = 0
      return False

  def reset(self):
    self._last_snapshot = ""
    self._consecutive_stale = 0

class SubAgent:
  """A sub-agent that manages a Docker container and runs autonomously in a thread.

  The LLM dynamically fetches terminal output using read_terminal and decides
  when to wait using wait_for_output. Context is managed intelligently via
  summarization when conversation history grows large.
  """

  def __init__(self, subagent_id: str, task: str, image: str = "ubuntu:latest"):
    self.id = subagent_id
    self.task = task
    self.image = image
    self.state = {
      "status": "starting",  # starting, running, completed, error
      "completed_steps": [],
      "findings": [],
      "summary": None,
    }
    self.thread = None
    self.messages: queue.Queue = queue.Queue()
    self.controller = Controller(image, tag=subagent_id)
    self.terminal_tracker = TerminalTracker()

    # LLM
    self.llm = ChatGroq(
      # model="moonshotai/kimi-k2-instruct-0905",
      model="openai/gpt-oss-120b",
      api_key=os.getenv("GROQ_API_KEY"),
      temperature=0,
    )
    # self.llm = ChatOllama(
    #   model="qwen3.5:9b",
    #   reasoning=False
    # )
    self.context_manager = ContextManager(self.llm)

    self.agent = create_react_agent(
      model=self.llm,
      tools=SUB_AGENT_TOOLS,
      checkpointer=InMemorySaver(),
      prompt=SUB_AGENT_PROMPT,
    )
    self.stop_event = threading.Event()
    self.config = {
      "configurable": {
        "thread_id": subagent_id,
        "subagent_id": subagent_id,
        "controller": self.controller,
        "messages": self.messages,
        "state": self.state,
        "terminal_tracker": self.terminal_tracker,
        "stop_event": self.stop_event,
      }
    }
    self.db = DBManager()
  
  def start(self):
    """Start the container and the sub-agent loop in a background thread."""
    self.controller.start()
    self.thread = threading.Thread(target=self._run, daemon=True)
    self.thread.start()

  def _run(self):
    """The sub-agent's autonomous loop.

    The LLM is fully in control of terminal interaction:
    - It calls read_terminal to check output
    - It calls wait_for_output when it detects stale output
    - Context is automatically summarized when it grows too large
    """
    log_info(f"Started — task: {self.task}", agent_id=self.id)
    self.state["status"] = "running"
    self.db.update_vm_status(self.id, "running")

    initial_message = (
      f"Your assigned task:\n{self.task}\n\n"
      f"You are in a fresh {self.image} container. Begin your work now.\n"
      f"Remember to use `mark_step_completed` after each step and `report_finding` whenever you discover something noteworthy."
    )

    messages = [{"role": "user", "content": initial_message}]
    max_iterations = 30
    iteration = 0

    try:
      while iteration < max_iterations and self.state["status"] == "running" and not self.stop_event.is_set():
        iteration += 1
        log_info(f"Iteration {iteration}/{max_iterations}", agent_id=self.id)

        log_info("Calling sub-agent inference", agent_id=self.id)
        response = self.agent.invoke(
          {"messages": messages},
          self.config,
        )

        last_message = response["messages"][-1]

        # Check if sub-agent reported findings
        if self.state["status"] == "completed":
          log_info("Task completed", agent_id=self.id)
          break

        # Check for messages from main agent
        pending = []
        while not self.messages.empty():
          try:
            pending.append(self.messages.get_nowait())
          except queue.Empty:
            break

        if pending:
          msg_text = "\n".join(f"- {m}" for m in pending)
          messages = [{"role": "user", "content": f"Messages from main agent:\n{msg_text}\n\nAcknowledge and continue your task."}]
        else:
          has_tool_calls = hasattr(last_message, 'tool_calls') and last_message.tool_calls
          if not has_tool_calls:
            messages = [{"role": "user", "content": "Continue your task. Remember to use `mark_step_completed` after each step. If done, use `report_to_main` to signal completion."}]
          else:
            messages = [{"role": "user", "content": "Continue."}]

        try:
          checkpoint_state = self.agent.get_state(self.config)
          all_messages = checkpoint_state.values.get("messages", [])
          if len(all_messages) > ContextManager.MAX_MESSAGES:
            log_info("Trimming message...", agent_id=self.id)
            trimmed = self.context_manager.trim_context(all_messages)
            self.agent.update_state(
              self.config,
              {"messages": trimmed},
            )
            log_info(f"Context trimmed: {len(all_messages)} → {len(trimmed)} messages", agent_id=self.id)
        except Exception as e:
          log_warn(f"Context trim warning: {e}", agent_id=self.id)

        self.stop_event.wait(2.0)

      if self.state["status"] == "running" and not self.stop_event.is_set():
        self.state["status"] = "stopped"
        self.state["summary"] = self.state.get("summary") or "Max iterations reached without explicit completion."
        self.db.update_vm_status(self.id, "stopped")

    except InterruptedError:
      log_info("Sub-agent thread forcefully interrupted", agent_id=self.id)
    except Exception as e:
      if self.stop_event.is_set():
        log_info(f"Sub-agent stopped during exception: {e}", agent_id=self.id)
      else:
        log_error(f"Error: {e}", agent_id=self.id)
        self.state["status"] = "error"
        self.state["summary"] = f"Error during execution: {str(e)}"
        self.db.update_vm_status(self.id, "error")

  def send_message(self, message: str):
    """Send a message to this sub-agent from the main agent."""
    self.messages.put(message)

  def get_status(self) -> str:
    return self.state["status"]

  def get_completed_steps(self) -> list[str]:
    return self.state.get("completed_steps", [])

  def get_findings(self) -> list[str]:
    return self.state.get("findings", [])

  def get_summary(self) -> str | None:
    return self.state.get("summary")

  def stop(self):
    try:
      self.stop_event.set()
      if self.state["status"] in ["starting", "running"]:
        self.state["status"] = "stopped"
        self.state["summary"] = self.state.get("summary") or "Task stopped by user."
        try:
          self.db.update_vm_status(self.id, "stopped")
        except Exception as e:
          log_warn(f"Failed to update DB on stop: {e}", agent_id=self.id)
    except Exception as e:
      log_warn(f"Error during stop state update: {e}", agent_id=self.id)
      
    try:
      self.controller.stop()
    except Exception as e:
      log_warn(f"Error stopping controller: {e}", agent_id=self.id)
