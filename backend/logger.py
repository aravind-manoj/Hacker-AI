from celery.utils.log import get_task_logger

_celery_logger = get_task_logger("pentester")


def _fmt(agent_id: str | None, message: str) -> str:
  if agent_id:
    return f"[{agent_id}] {message}"
  return message


def log_info(message: str, agent_id: str | None = None) -> None:
  print(_fmt(agent_id, message))

def log_warn(message: str, agent_id: str | None = None) -> None:
  print(_fmt(agent_id, message))

def log_error(message: str, agent_id: str | None = None) -> None:
  print(_fmt(agent_id, message))

def log_debug(message: str, agent_id: str | None = None) -> None:
  print(_fmt(agent_id, message))
