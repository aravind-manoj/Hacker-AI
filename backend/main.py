from db_manager import DBManager
import os
import ssl
import time
import threading
import redis
from celery import Celery
from dotenv import load_dotenv
from agent import AgentManager
from sub_agent import SubAgent
from context_manager import ContextManager
from logger import log_info, log_warn, log_error
from uuid import uuid4

load_dotenv()

app = Celery(
  "worker",
  broker=os.getenv("RABBITMQ_URL"),
  backend=os.getenv("REDIS_URL")
)

app.conf.update(
    redis_backend_use_ssl = {
        'ssl_cert_reqs': ssl.CERT_REQUIRED
    }
)

class AI:
  def __init__(self, attack_id: str):
    self.attack_id = attack_id
    self.subagents: dict[str, SubAgent] = {}
    self.findings: list[str] = []
    self.agent_manager = AgentManager()
    self.agent = self.agent_manager.initialize()
    self.stop_event = threading.Event()
    self.config = {
      "configurable": {
        "thread_id": str(uuid4()),
        "subagents": self.subagents,
        "findings": self.findings,
        "attack_id": self.attack_id,
        "stop_event": self.stop_event,
      }
    }
    self.context_manager = ContextManager(self.agent_manager.llm)
    self.db = DBManager()
    self.redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)

  def _cleanup(self):
    log_info("Cleaning up all sub-agents...", agent_id="main")
    for sub in list(self.subagents.values()):
      try:
        sub.stop()
      except Exception as e:
        log_warn(f"Error stopping subagent: {e}", agent_id="main")

  def _monitor_stop_flag(self):
    while not self.stop_event.is_set():
      try:
        flag = self.redis_client.get(f"forcestop_{self.attack_id}")
        if flag == "true":
          log_info(f"Stop flag detected for attack {self.attack_id}. Triggering shutdown.", agent_id="main")
          self.stop_event.set()
          self._cleanup()
          break
      except Exception as e:
        log_warn(f"Error checking stop flag: {e}", agent_id="main")
      self.stop_event.wait(5.0)

  def run(self, target_list: str, attack_vectors: list[str], note: str):
    """
    Runs the main agent in a continuous loop.
    The LLM dynamically monitors sub-agents via its tools.
    Context is managed intelligently via summarization when history grows large.
    """
    log_info(f"Starting autonomous pentesting against {target_list}", agent_id="main")
    self.db.update_attack_status(self.attack_id, "running")

    monitor_thread = threading.Thread(target=self._monitor_stop_flag, daemon=True)
    monitor_thread.start()

    initial_message = (
      f"Your target is: {",".join(target_list)}\n"
      f"Suggested attack vectors: {', '.join(attack_vectors)}\n"
      f"User note/instruction: {note}\n\n"
      f"Begin your pentesting assessment. Create sub-agents for each task, monitor their progress, and compile a final report when done."
    )

    messages = [{"role": "user", "content": initial_message}]

    max_iterations = 50
    iteration = 0

    while iteration < max_iterations and not self.stop_event.is_set():
      iteration += 1
      log_info(f"=== Iteration {iteration} ===", agent_id="main")

      try:
        log_info("Calling main agent inference", agent_id="main")
        response = self.agent.invoke(
          {"messages": messages},
          self.config
        )

        # Check if stop event was set during invoke
        if self.stop_event.is_set():
          log_info("Stop event detected during inference or just after, exiting loop...", agent_id="main")
          break

        last_message = response["messages"][-1]
        content = last_message.content if hasattr(last_message, 'content') else str(last_message)

        # Check if the main agent has finalized the report
        if self.findings:
          log_info("Final report submitted. Wrapping up...", agent_id="main")
          break

        has_tool_calls = hasattr(last_message, 'tool_calls') and last_message.tool_calls
        if not has_tool_calls:
          messages = [{"role": "user", "content": "Continue monitoring your sub-agents. Check their status, completed steps, and findings. Use send_message to assist sub-agents if needed. When all are done, collect findings with get_subagent_findings and compile the final report with finalize_report."}]
        else:
          messages = [{"role": "user", "content": "Continue."}]

      except Exception as e:
        error_str = str(e)
        log_error(f"Error during iteration {iteration}: {error_str}", agent_id="main")
        time.sleep(2)
        messages = [{"role": "user", "content": f"An error occurred: {error_str}. Please continue your assessment."}]

      try:
        checkpoint_state = self.agent.get_state(self.config)
        all_messages = checkpoint_state.values.get("messages", [])
        if len(all_messages) > ContextManager.MAX_MESSAGES:
          log_info("Trimming message...", agent_id="main")
          trimmed = self.context_manager.trim_context(all_messages)
          self.agent.update_state(
            self.config,
            {"messages": trimmed},
          )
          log_info(f"Context trimmed: {len(all_messages)} → {len(trimmed)} messages", agent_id="main")
      except Exception as e:
        log_warn(f"Context trim warning: {e}", agent_id="main")

      # Post-iteration sleep
      self.stop_event.wait(5.0)

    # Set status only if not forcefully stopped
    if not self.stop_event.is_set():
      self.db.update_attack_status(self.attack_id, "completed")

    self._cleanup()

    if self.stop_event.is_set():
      return "Main agent stopped by user request."
    elif self.findings:
      return "\n\n---\n\n".join(self.findings)
    else:
      return "Main agent reached maximum iterations without finalizing a report."


@app.task(name="worker.attack", result_expires=86400)
def attack(attack_id: str, target_list: list[str], attack_vectors: list[str], note: str):
  ai = AI(attack_id)
  result = ai.run(target_list, attack_vectors, note)
  log_info(f"Result:\n{result}", agent_id="main")
  return result