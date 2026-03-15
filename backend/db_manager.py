import uuid
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import datetime

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class DBManager:
  def __init__(self):
    self.supabase = supabase

  def update_attack_status(self, attack_id: str, status: str):
    if status == "completed":
      self.supabase.table("attack").update({"status": status, "completed_at": datetime.datetime.now().isoformat()}).eq("id", attack_id).execute()
    else:
      self.supabase.table("attack").update({"status": status}).eq("id", attack_id).execute()

  def create_vm(self, attack_id: str, subagent_id: str, task: str):
    self.supabase.table("attack_vm").insert({"id": str(uuid.uuid4()), "attack_id": attack_id, "subagent_id": subagent_id, "task": task, "status": "starting"}).execute()
  
  def update_vm_buffer(self, subagent_id: str, buffer: str):
    self.supabase.table("attack_vm").update({"buffer": buffer}).eq("subagent_id", subagent_id).execute()

  def update_vm_status(self, subagent_id: str, status: str):
    self.supabase.table("attack_vm").update({"status": status}).eq("subagent_id", subagent_id).execute()
  
  def update_system_buffer(self, system_id: str, buffer: str):
    self.supabase.table("system").update({"deploy_buffer": buffer}).eq("id", system_id).execute()
  
  def update_system_status(self, system_id: str, status: str):
    self.supabase.table("system").update({"status": status}).eq("id", system_id).execute()

  def update_vuln_buffer(self, vuln_id: str, buffer: str):
    self.supabase.table("vulnerability").update({"fix_log_buffer": buffer}).eq("id", vuln_id).execute()

  def update_vuln_status(self, vuln_id: str, is_fixed: bool, report: str, status: str = None):
    update_data = {
      "is_fixed": is_fixed,
      "fix_agent_report": report
    }
    if status is not None:
      update_data["status"] = status
    if is_fixed:
      update_data["fixed_at"] = datetime.datetime.now().isoformat()
    self.supabase.table("vulnerability").update(update_data).eq("id", vuln_id).execute()

  def append_completed_step(self, subagent_id: str, step: str):
    result = self.supabase.table("attack_vm").select("completed_steps").eq("subagent_id", subagent_id).execute()
    current_steps = []
    if result.data and result.data[0].get("completed_steps"):
      current_steps = result.data[0]["completed_steps"]
    current_steps.append(step)
    self.supabase.table("attack_vm").update({"completed_steps": current_steps}).eq("subagent_id", subagent_id).execute()

  def append_finding(self, subagent_id: str, finding: str):
    result = self.supabase.table("attack_vm").select("findings").eq("subagent_id", subagent_id).execute()
    current_findings = []
    if result.data and result.data[0].get("findings"):
      current_findings = result.data[0]["findings"]
    current_findings.append(finding)
    self.supabase.table("attack_vm").update({"findings": current_findings}).eq("subagent_id", subagent_id).execute()

  def get_vm_by_subagent(self, subagent_id: str) -> dict | None:
    result = self.supabase.table("attack_vm").select("*").eq("subagent_id", subagent_id).execute()
    if result.data:
      return result.data[0]
    return None

  def get_vms_by_attack(self, attack_id: str) -> list[dict]:
    result = self.supabase.table("attack_vm").select("*").eq("attack_id", attack_id).execute()
    return result.data or []

  def update_attack_findings(self, attack_id: str, report: str, vulnerabilities: list[str]):
    self.supabase.table("attack").update({"report": report, "vulnerabilities": vulnerabilities}).eq("id", attack_id).execute()

  def get_attack_user_id(self, attack_id: str) -> str | None:
    result = self.supabase.table("attack").select("user_id").eq("id", attack_id).execute()
    if result.data:
      return result.data[0].get("user_id")
    return None

  def create_report(self, attack_id: str, name: str, description: str, url: str):
    user_id = self.get_attack_user_id(attack_id)
    if user_id:
      self.supabase.table("report").insert({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": name,
        "description": description,
        "url": url
      }).execute()