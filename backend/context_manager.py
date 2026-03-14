from langchain_core.messages import (
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
)
from logger import log_info, log_error


class ContextManager:
  """Manages conversation context intelligently.

  Strategy:
  - Keep the system prompt + first user message (task assignment) always.
  - When message count exceeds the threshold, summarize older messages
    using the LLM and replace them with a compact summary.
  - Always preserve recent messages for continuity.
  """

  # Thresholds
  MAX_MESSAGES = 20           # trigger summarization when exceeded
  KEEP_RECENT = 10            # always keep the last N messages
  SUMMARIZE_BATCH_SIZE = 20   # how many older messages to summarize at once

  def __init__(self, llm):
    self.llm = llm
    self._summary_cache: str = ""  # running summary of older context

  def trim_context(self, messages: list) -> list:
    if len(messages) <= self.MAX_MESSAGES:
      return messages

    # Separate preserved and trimmable messages
    preserved_head = []
    rest = []

    for i, msg in enumerate(messages):
      if isinstance(msg, SystemMessage):
        preserved_head.append(msg)
      elif i <= 1:  # keep the first human message (task assignment)
        preserved_head.append(msg)
      else:
        rest.append(msg)

    if len(rest) <= self.KEEP_RECENT:
      return messages  # nothing to trim

    # Split: old messages to summarize | recent messages to keep
    to_summarize = rest[:-self.KEEP_RECENT]
    to_keep = rest[-self.KEEP_RECENT:]
    summary = self._summarize_messages(to_summarize)
    result = preserved_head.copy()
    if summary:
      result.append(HumanMessage(content=f"[CONTEXT SUMMARY of previous {len(to_summarize)} interactions]\n{summary}"))
    result.extend(to_keep)

    log_info(f"Trimmed {len(messages)} → {len(result)} messages "
             f"(summarized {len(to_summarize)} old messages)")

    return result

  def _summarize_messages(self, messages: list) -> str:
    try:
      # Build a text representation of the messages to summarize
      conversation_text = []
      for msg in messages:
        role = "Assistant" if isinstance(msg, AIMessage) else \
               "Tool" if isinstance(msg, ToolMessage) else "User"
        content = msg.content if hasattr(msg, 'content') and msg.content else ""
        if content:
          # Truncate very long tool outputs
          if isinstance(msg, ToolMessage) and len(content) > 500:
            content = content[:500] + "... [truncated]"
          conversation_text.append(f"{role}: {content}")

      if not conversation_text:
        return self._summary_cache

      full_text = "\n".join(conversation_text)

      summary_prompt = [
        SystemMessage(content=(
          "You are a concise summarizer. Summarize the following pentesting agent "
          "conversation into a brief, actionable summary. Focus on:\n"
          "- Commands that were executed and their key results\n"
          "- Important findings (open ports, vulnerabilities, errors)\n"
          "- Current state and what was being attempted\n"
          "Keep it under 300 words. Be factual and specific."
        )),
        HumanMessage(content=f"Previous context summary:\n{self._summary_cache}\n\n"
                             f"New conversation to summarize:\n{full_text}")
      ]

      response = self.llm.invoke(summary_prompt)
      self._summary_cache = response.content
      return self._summary_cache

    except Exception as e:
      log_error(f"Summarization failed: {e}")
      # Fallback: just keep the cached summary
      return self._summary_cache
