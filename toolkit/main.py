# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "requests",
#     "schedule",
# ]
# ///
import json
import os
import time
import schedule
import requests
import logging
import subprocess

# Basic logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.expanduser("~/.hackerai/config.json")

def load_config():
    try:
        if not os.path.exists(CONFIG_PATH):
            logger.error(f"Config file not found: {CONFIG_PATH}")
            return None
        with open(CONFIG_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to read config: {e}")
        return None

def run_trivy_scan():
    try:
        logger.info("Running Trivy system scan...")
        command = [
            "sudo", "trivy", "rootfs", "-f", "json", "-o", "scan.json", 
            "--skip-dirs", "/proc,/sys,/dev,/tmp,/run", "/"
        ]
        subprocess.run(command, check=True, capture_output=True, text=True)
        
        if os.path.exists("scan.json"):
            with open("scan.json", "r") as f:
                return json.load(f)
        else:
            logger.warning("scan.json was not created.")
            return None
    except subprocess.CalledProcessError as e:
        logger.error(f"Trivy scan failed with error: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Error during Trivy scan: {e}")
        return None

def send_update():
    config = load_config()
    if not config:
        return

    agent_id = config.get("agent_id")
    secret_key = config.get("secret_key")
    endpoint_address = config.get("endpoint_address")

    if not all([agent_id, secret_key, endpoint_address]):
        logger.error("Missing required configuration values")
        return

    scan_data = run_trivy_scan()

    payload = {
        "secret-key": secret_key,
        "scan_data": scan_data,
    }

    try:
        logger.info(f"Sending check-in to {endpoint_address}")
        response = requests.post(f"{endpoint_address}/api/agent/{agent_id}", json=payload, timeout=30)
        
        if response.status_code == 200:
            logger.info("Successfully updated database")
        else:
            logger.warning(f"Failed to update database. Status Code: {response.status_code}, Response: {response.text}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Connection error: {e}")

if __name__ == "__main__":
    logger.info("Starting Hacker AI Agent service")
    
    # Send an immediate update on startup
    send_update()

    # Schedule the job every hour
    schedule.every().hour.do(send_update)

    while True:
        schedule.run_pending()
        time.sleep(60)
