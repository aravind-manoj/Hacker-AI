from langchain_core.messages import (
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
  RemoveMessage,
)
from logger import log_info, log_error


class ContextManager:
  """Manages conversation context intelligently.

  Strategy:
  - Keep the system prompt + first user message (task assignment) always.
  - Retain the reasoning (content) of all AIMessages to preserve the train of thought.
  - For tool calls and their outputs (ToolMessages), keep only the most recent N
    (e.g., 2) for each specific tool type.
  - Remove older tool calls and their results from the state. This drastically 
    reduces token usage while preventing the agent from losing its context.
  """

  MAX_MESSAGES = 20           # Required threshold for main/subagent limits
  KEEP_TOOL_CALLS_PER_TYPE = 3

  def __init__(self, llm):
    # LLM is preserved here for backward compatibility
    self.llm = llm

  def trim_context(self, messages: list) -> list:
    """
    Returns a list of message updates to apply to the LangGraph state.
    - Preserved messages are returned as-is.
    - Dropped ToolMessages are replaced with RemoveMessage(id=...)
    - Spliced AIMessages (where old tool calls are removed) are returned with matching IDs
      so they overwrite the swollen old messages.
    """
    if len(messages) <= self.MAX_MESSAGES:
      return messages

    tool_counts = {}
    tool_call_ids_to_keep = set()

    # Determine which ToolMessages to keep (most recent N per tool name)
    for msg in reversed(messages):
      if isinstance(msg, ToolMessage):
        count = tool_counts.get(msg.name, 0)
        if count < self.KEEP_TOOL_CALLS_PER_TYPE:
          tool_call_ids_to_keep.add(msg.tool_call_id)
          tool_counts[msg.name] = count + 1

    updates = []
    
    for i, msg in enumerate(messages):
      # 1. System messages are always kept
      if isinstance(msg, SystemMessage):
        updates.append(msg)
        continue
        
      # 2. First Human message (task definition) is always kept
      if isinstance(msg, HumanMessage) and i <= 2:
        updates.append(msg)
        continue
        
      # 3. Other Human messages
      if isinstance(msg, HumanMessage):
        updates.append(msg)
        continue

      # 4. ToolMessages checking
      if isinstance(msg, ToolMessage):
        if msg.tool_call_id in tool_call_ids_to_keep:
          updates.append(msg)
        else:
          # Actually remove it from LangGraph state to save tokens
          updates.append(RemoveMessage(id=msg.id))
        continue
        
      # 5. AIMessages pruning
      if isinstance(msg, AIMessage):
        has_tools = hasattr(msg, 'tool_calls') and msg.tool_calls
        if has_tools:
          new_tool_calls = [tc for tc in msg.tool_calls if tc['id'] in tool_call_ids_to_keep]
          if len(new_tool_calls) == len(msg.tool_calls):
            updates.append(msg)
          else:
            # Overwrite the AIMessage in state with pruned tool_calls
            content = msg.content if msg.content else "[Older tool calls removed to save context window]"
            new_msg = AIMessage(
              content=content,
              tool_calls=new_tool_calls,
              id=msg.id
            )
            updates.append(new_msg)
        else:
          updates.append(msg)

    log_info(f"Context trimmed: scheduled {len(updates)} state updates. Tool retention: {tool_counts}")
    return updates
