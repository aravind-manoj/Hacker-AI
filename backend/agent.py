import os
import time
import threading
from uuid import uuid4
from typing import Annotated
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool, InjectedToolArg
from langgraph.checkpoint.memory import InMemorySaver
from prompts import MAIN_AGENT_PROMPT
from sub_agent import SubAgent
from db_manager import DBManager
from logger import log_info

@tool("create_subagent")
def create_subagent(
  task: str,
  image: str = "ubuntu:latest",
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Create a new sub-agent with its own Docker container to perform a specific task.
  The sub-agent will start working on the task immediately and autonomously.

  Args:
    task: A detailed, step-by-step task description for the sub-agent. Include:
          - WHAT to do (e.g., "Perform a port scan on 192.168.1.1")
          - HOW to do it (e.g., "1. Install nmap  2. Run nmap -sV -sC 192.168.1.1  3. Analyze results")
          - What to LOOK FOR (e.g., "Open ports, service versions, potential vulnerabilities")
    image: Docker image to use (default: ubuntu:latest)
  """
  try:
    registry: dict[str, SubAgent] = config["configurable"]["subagents"]
    subagent_id = f"subagent-{str(uuid4())}"
    attack_id = config["configurable"]["attack_id"]
    db = DBManager()
    db.create_vm(attack_id, subagent_id, task)
    
    sub = SubAgent(subagent_id, task, image)
    sub.start()
    registry[subagent_id] = sub
    return f"Sub-agent '{subagent_id}' created and started.\nTask:\n{task}"
  except Exception as e:
    return f"Error creating sub-agent: {str(e)}"


@tool("send_message")
def send_message(
  subagent_id: str,
  message: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Send a message or instruction to a running sub-agent to help or assist it.
  Use this to provide guidance, share information, suggest alternative approaches,
  or help a sub-agent that seems stuck.

  Examples:
    - "Try using nikto instead of nmap for web vulnerability scanning"
    - "The target is behind a firewall, try using -Pn flag with nmap"
    - "Focus on port 8080, it might have a web application running"
    - "Check if there's a robots.txt file on the web server"

  Args:
    subagent_id: The ID of the sub-agent
    message: The message, instruction, or guidance to send
  """
  registry: dict[str, SubAgent] = config["configurable"]["subagents"]
  sub = registry.get(subagent_id)
  if not sub:
    return f"Error: Sub-agent '{subagent_id}' not found."
  sub.send_message(message)
  return f"Message sent to {subagent_id}: {message}"


@tool("check_subagent_status")
def check_subagent_status(
  subagent_id: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Check the current status, completed steps, and findings of a sub-agent.
  If the sub-agent is still running, you MUST decide to wait and give it time to make progress.

  Args:
    subagent_id: The ID of the sub-agent to check
  """
  registry: dict[str, SubAgent] = config["configurable"]["subagents"]
  sub = registry.get(subagent_id)
  if not sub:
    return f"Error: Sub-agent '{subagent_id}' not found."

  status = sub.get_status()
  completed_steps = sub.get_completed_steps()
  findings = sub.get_findings()

  result = f"Sub-agent '{subagent_id}':\n"
  result += f"  Status: {status}\n"

  if completed_steps:
    result += f"  Completed Steps ({len(completed_steps)}):\n"
    for i, step in enumerate(completed_steps, 1):
      result += f"    {i}. {step}\n"
  else:
    result += "  Completed Steps: None yet\n"

  if findings:
    result += f"  Findings ({len(findings)}):\n"
    for i, finding in enumerate(findings, 1):
      result += f"    {i}. {finding}\n"
  else:
    result += "  Findings: None yet\n"

  return result


@tool("get_subagent_findings")
def get_subagent_findings(
  subagent_id: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Get all findings from a sub-agent. ONLY CALL THIS TOOL WHEN THE SUB-AGENT STATUS IS `completed`.
  DO NOT call this tool while the sub-agent is still running.

  Use `check_subagent_status` tool before using this tool to confirm completion.

  Args:
    subagent_id: The ID of the sub-agent
  """
  registry: dict[str, SubAgent] = config["configurable"]["subagents"]
  sub = registry.get(subagent_id)
  if not sub:
    return f"Error: Sub-agent '{subagent_id}' not found."

  findings = sub.get_findings()
  summary = sub.get_summary()

  result = f"--- Findings from {subagent_id} ---\n"
  if findings:
    for i, finding in enumerate(findings, 1):
      result += f"  {i}. {finding}\n"
  else:
    result += "  No findings reported yet.\n"

  if summary:
    result += f"\n  Summary: {summary}\n"

  return result


@tool("list_subagents")
def list_subagents(
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """List all sub-agents with their ID and assigned task."""
  registry: dict[str, SubAgent] = config["configurable"]["subagents"]
  if not registry:
    return "No sub-agents have been created."

  lines = []
  for sid, sub in registry.items():
    task_preview = sub.task
    line = f"- **{sid}**:\n{task_preview}"
    lines.append(line)

  return "Sub-agents:\n" + "\n".join(lines)


@tool("stop_subagent")
def stop_subagent(
  subagent_id: str,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Forcefully stop a sub-agent and its Docker container.

  Args:
    subagent_id: The ID of the sub-agent to stop
  """
  try:
    registry: dict[str, SubAgent] = config["configurable"]["subagents"]
    sub = registry.get(subagent_id)
    if not sub:
      return f"Error: Sub-agent '{subagent_id}' not found."
    sub.stop()
    return f"Sub-agent '{subagent_id}' stopped."
  except Exception as e:
    return f"Error stopping sub-agent: {str(e)}"


@tool("finalize_report")
def finalize_report(
  report: str,
  vulnerabilities: list[str],
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Submit the final compiled pentesting report. ONLY CALL THIS TOOL WHEN ALL SUB-AGENTS HAVE COMPLETED THEIR TASKS.
  DO NOT call this if any sub-agent is still running.

  Use `get_subagent_findings` to collect all findings before calling this.

  Args:
    report: The comprehensive final report combining findings from all sub-agents
    vulnerabilities: The list of vulnerabilities found
  """
  attack_id = config["configurable"]["attack_id"]
  db = DBManager()
  db.update_attack_findings(attack_id, report, vulnerabilities)
  return "Final report submitted. Assessment complete."

@tool("wait")
def wait(
  seconds: int,
  config: Annotated[RunnableConfig, InjectedToolArg] = None,
) -> str:
  """Wait for a specified number of seconds. Use this when you are waiting for sub-agents to complete their tasks or when their status hasn't changed.
  
  Args:
    seconds: The number of seconds to wait (e.g., 10, 30, 60)
  """
  log_info(f"Waiting for {seconds}", agent_id="main")
  stop_event = config["configurable"].get("stop_event", threading.Event())
  stop_event.wait(seconds)
  if stop_event.is_set():
    raise InterruptedError("Main agent stopped")
  return f"Waited for {seconds} seconds."


MAIN_AGENT_TOOLS = [
  create_subagent,
  send_message,
  check_subagent_status,
  get_subagent_findings,
  list_subagents,
  stop_subagent,
  finalize_report,
  wait,
]


class AgentManager:
  def __init__(self):
    self.llm = ChatGroq(
      # model="moonshotai/kimi-k2-instruct-0905",
      model="openai/gpt-oss-20b",
      api_key=os.getenv("GROQ_API_KEY"),
      temperature=0,
    )
    # self.llm = ChatOpenAI(
    #   api_key=os.getenv("OPENROUTER_API_KEY"),
    #   base_url="https://openrouter.ai/api/v1",
    #   model="moonshotai/kimi-k2.5",
    # )

    # self.llm = ChatOllama(
    #   model="qwen3.5:9b",
    #   reasoning=False
    # )

    self.agent = create_react_agent(
      model=self.llm,
      tools=MAIN_AGENT_TOOLS,
      checkpointer=InMemorySaver(),
      prompt=MAIN_AGENT_PROMPT,
    )

  def initialize(self):
    return self.agent