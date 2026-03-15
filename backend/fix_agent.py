import os
import time
import queue
import threading
import redis
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
from ssh_controller import SSHController
from prompts import FIX_AGENT_PROMPT
from db_manager import DBManager
from logger import log_info, log_warn, log_error, log_debug


@tool("execute_command")
def execute_command(
  command: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Execute a shell command via SSH.

  Args:
    command: The shell command to execute
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("FixAgent stopped")
    controller: SSHController = config["configurable"]["controller"]
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
  """Read the recent terminal output from the SSH session.
  Use this to check command results and monitor progress.

  IMPORTANT: If you call this tool twice in a row and the output is identical
  both times, the terminal has not changed. In that case you MUST call the
  `wait_for_output` tool to avoid busy-waiting, and then read again.

  Args:
    last_chars: Number of characters to read from the end of the buffer (min 2000, default 5000)
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("FixAgent stopped")
    controller: SSHController = config["configurable"]["controller"]
    terminal_tracker = config["configurable"]["terminal_tracker"]
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
    raise InterruptedError("FixAgent stopped")
  
  return f"Waited {seconds} seconds. You can now read the terminal again to check for new output."


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
  tokens = raw.split()
  result = []
  for token in tokens:
    mapped = _KEY_MAP.get(token.lower())
    if mapped:
      result.append(mapped)
    elif len(token) == 1:
      result.append(token)
    else:
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

  Supported special keys: Enter, Tab, Backspace, Escape, Ctrl+C, Ctrl+D,
  Ctrl+Z, Ctrl+L, Ctrl+A, Ctrl+E, Ctrl+U, Up, Down, Left, Right, Space

  Args:
    keys: Space-separated key names or characters to send
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("FixAgent stopped")
    controller: SSHController = config["configurable"]["controller"]
    translated = _translate_keys(keys)
    controller.send_keys(translated)
    log_info(f"Keys: {repr(keys)} → {repr(translated)}", agent_id=controller.tag)
    return f"Keys sent: {repr(keys)} (translated to {repr(translated)})"
  except Exception as e:
    return f"Error sending keys: {str(e)}"


@tool("finalize_patch")
def finalize_patch(
  report: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Signal that the vulnerability has been patched and provide the final report.

  Args:
    report: A detailed summary of how the vulnerability was fixed.
  """
  try:
    if config["configurable"].get("stop_event", threading.Event()).is_set():
      raise InterruptedError("FixAgent stopped")
    state: dict = config["configurable"]["state"]
    state["summary"] = report
    state["status"] = "completed"

    return "Patch finalized."
  except Exception as e:
    return f"Error finalizing patch: {str(e)}"


FIX_AGENT_TOOLS = [
  execute_command,
  read_terminal,
  wait_for_output,
  send_keys,
  finalize_patch,
]

class TerminalTracker:
  def __init__(self):
    self._last_snapshot: str = ""
    self._consecutive_stale: int = 0

  def update(self, current_screen: str) -> bool:
    if current_screen == self._last_snapshot:
      self._consecutive_stale += 1
      return self._consecutive_stale >= 2
    else:
      self._last_snapshot = current_screen
      self._consecutive_stale = 0
      return False

  def reset(self):
    self._last_snapshot = ""
    self._consecutive_stale = 0

class FixAgent:
  """An AI Bug Fixer that connects to a target system via SSH to patch vulnerabilities."""

  def __init__(self, vuln_id: str, title: str, description: str, severity: str, cve_id: str, system_id: str, ssh_host: str, ssh_port: str, ssh_username: str, ssh_password: str, ssh_key: str):
    self.id = vuln_id
    self.title = title
    self.description = description
    self.severity = severity
    self.cve_id = cve_id
    self.system_id = system_id
    
    self.state = {
      "status": "starting",
      "summary": None,
    }
    
    key_file = None
    if ssh_key:
      import tempfile
      fd, key_file = tempfile.mkstemp()
      with os.fdopen(fd, 'w') as f:
        f.write(ssh_key)
        
    self.controller = SSHController(
      hostname=ssh_host,
      username=ssh_username,
      password=ssh_password,
      key_filename=key_file,
      port=int(ssh_port),
      tag=vuln_id,
      system_id_for_db=system_id # Modified SSH Controller so the DB logs go to vuln
    )
    # We monkey-patch the controller so it updates the DB for vulnerability instead
    def custom_sync_db(self_ctrl):
        while self_ctrl.running:
            needs_update = False
            with self_ctrl.lock:
                current_length = len(self_ctrl.buffer)
                if current_length > self_ctrl.last_saved_length:
                    buffer_snapshot = self_ctrl.buffer
                    self_ctrl.last_saved_length = current_length
                    needs_update = True
            if needs_update:
                try:
                    self_ctrl.db.update_vuln_buffer(self_ctrl.tag, buffer_snapshot)
                except Exception as e:
                    log_error(f"Failed to update vuln DB buffer: {e}", agent_id=self_ctrl.tag)
            import time
            time.sleep(5)
            
    self.controller._sync_db = custom_sync_db.__get__(self.controller, SSHController)
    
    self.terminal_tracker = TerminalTracker()

    # LLM
    self.llm = ChatGroq(
      model="openai/gpt-oss-120b",
      api_key=os.getenv("GROQ_API_KEY"),
      temperature=0,
    )
    self.context_manager = ContextManager(self.llm)

    self.agent = create_react_agent(
      model=self.llm,
      tools=FIX_AGENT_TOOLS,
      checkpointer=InMemorySaver(),
      prompt=FIX_AGENT_PROMPT,
    )
    self.stop_event = threading.Event()
    self.config = {
      "configurable": {
        "thread_id": vuln_id,
        "controller": self.controller,
        "state": self.state,
        "terminal_tracker": self.terminal_tracker,
        "stop_event": self.stop_event,
      }
    }
    self.db = DBManager()
    self.redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)
    self.key_file = key_file
  
  def _monitor_stop_flag(self):
    while not self.stop_event.is_set():
      try:
        flag = self.redis_client.get(f"forcestop_{self.id}")
        if flag == "true":
          log_info(f"Stop flag detected for vulnerability fix {self.id}. Triggering shutdown.", agent_id=self.id)
          self.stop_event.set()
          break
      except Exception as e:
        log_warn(f"Error checking stop flag: {e}", agent_id=self.id)
      self.stop_event.wait(5.0)

  def run(self):
    """The fix-agent's autonomous loop."""
    log_info(f"Started fix agent for vulnerability: {self.title}", agent_id=self.id)
    self.state["status"] = "running"
    
    self.db.update_vuln_status(self.id, is_fixed=False, report=None, status="fixing")
    
    threading.Thread(target=self._monitor_stop_flag, daemon=True).start()

    try:
      self.controller.start()
    except Exception as e:
       self.db.update_vuln_status(self.id, is_fixed=False, report=f"Failed to connect via SSH: {e}", status="failed")
       return

    # Clear screen initially
    self.controller.send_command("clear")
    time.sleep(1)

    initial_message = (
      f"You are an AI Bug Fixer. Your goal is to patch the following vulnerability on the connected SSH system.\n"
      f"Title: {self.title}\n"
      f"CVE ID: {self.cve_id}\n"
      f"Severity: {self.severity}\n"
      f"Description: {self.description}\n\n"
      f"You are in a live SSH session. Execute commands, install patches, update configurations, and verify the fix.\n"
      f"Use `read_terminal` to see the prompt and output. Use `finalize_patch` when the vulnerability has been completely fixed."
    )

    messages = [{"role": "user", "content": initial_message}]
    max_iterations = 30
    iteration = 0

    try:
      while iteration < max_iterations and self.state["status"] == "running" and not self.stop_event.is_set():
        iteration += 1
        log_info(f"Iteration {iteration}/{max_iterations}", agent_id=self.id)

        response = self.agent.invoke(
          {"messages": messages},
          self.config,
        )

        if self.state["status"] == "completed":
          log_info("Patch finalized", agent_id=self.id)
          break

        last_message = response["messages"][-1]
        has_tool_calls = hasattr(last_message, 'tool_calls') and last_message.tool_calls
        if not has_tool_calls:
          messages = [{"role": "user", "content": "Continue your task. Use `finalize_patch` if you are done."}]
        else:
          messages = [{"role": "user", "content": "Continue."}]

        try:
          checkpoint_state = self.agent.get_state(self.config)
          all_messages = checkpoint_state.values.get("messages", [])
          if len(all_messages) > ContextManager.MAX_MESSAGES:
            trimmed = self.context_manager.trim_context(all_messages)
            self.agent.update_state(
              self.config,
              {"messages": trimmed},
            )
        except Exception as e:
          log_warn(f"Context trim warning: {e}", agent_id=self.id)

        self.stop_event.wait(2.0)

      if self.state["status"] == "running" and not self.stop_event.is_set():
        self.state["status"] = "failed"
        self.state["summary"] = "Max iterations reached without fixing the vulnerability."
        
    except Exception as e:
      self.state["status"] = "error"
      self.state["summary"] = f"Error during execution: {str(e)}"

    finally:
      self.controller.stop()
      if self.key_file and os.path.exists(self.key_file):
        os.remove(self.key_file)
        
      # Only mark as fixed if the AI finalized it
      is_fixed = self.state["status"] == "completed"
      report = self.state.get("summary", "No report generated.")
      
      final_status = "fixed" if is_fixed else "stopped" if self.stop_event.is_set() else "failed"
      if self.state["status"] == "error":
         final_status = "error"
      
      self.db.update_vuln_status(self.id, is_fixed, report, status=final_status)

      return report
