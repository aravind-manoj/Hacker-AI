#!/bin/bash

# Hacker AI Agent - Installation Script
# Downloads and installs the resource monitoring script as a systemd service

set -e

# Arguments
AGENT_ID=$1
SECRET_KEY=$2
ENDPOINT_ADDRESS=$3

if [ -z "$AGENT_ID" ] || [ -z "$SECRET_KEY" ] || [ -z "$ENDPOINT_ADDRESS" ]; then
    echo "Usage: $0 <agent_id> <secret_key> <endpoint_address>"
    exit 1
fi

INSTALL_DIR="/opt/hacker-ai"
SERVICE_NAME="hacker-ai-agent"
PYTHON_SCRIPT="main.py"
CONFIG_DIR="$HOME/.hackerai"
CONFIG_FILE="$CONFIG_DIR/config.json"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run this script as root"
    exit 1
fi

echo "Starting Hacker AI Agent installation..."

# Install uv if not present
if ! command -v uv &> /dev/null; then
    echo "uv not found. Installing..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # Source the environment variables so uv is immediately available
    source "$HOME/.local/bin/env"
else
    echo "uv is already installed"
fi

# Ensure uv's install paths are in PATH
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# Create installation directory
echo "Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Download main.py from GitHub directly to the install directory
echo "Downloading main.py from GitHub repository..."
curl -sSL "https://raw.githubusercontent.com/aravind-manoj/Hacker-AI/refs/heads/main/toolkit/main.py" -o "$INSTALL_DIR/$PYTHON_SCRIPT"
chmod +x "$INSTALL_DIR/$PYTHON_SCRIPT"

# Ensure dependencies are available using a Virtual Environment
echo "Installing Python dependencies with uv..."
cd "$INSTALL_DIR"
# 1. Create a virtual environment
uv venv
# 2. Install dependencies into the virtual environment safely
uv pip install schedule requests
cd - > /dev/null

# Create config directory and file with provided values
echo "Creating config file at $CONFIG_FILE..."
mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_FILE" << EOF
{
    "agent_id": "$AGENT_ID",
    "secret_key": "$SECRET_KEY",
    "endpoint_address": "$ENDPOINT_ADDRESS"
}
EOF
echo "Config file created with provided values"

log_info() { echo "[INFO] $1"; }
log_warn() { echo "[WARN] $1"; }

# Register host with backend
log_info "Registering host with backend..."

BASE_URL="${ENDPOINT_ADDRESS}"
# Ensure we don't have double slashes if endpoint_address has trailing slash
BASE_URL=${BASE_URL%/}

CONNECT_AGENT_URL="${BASE_URL}/api/connect-agent/${AGENT_ID}"

log_info "Sending registration request to $CONNECT_AGENT_URL"
# Use curl to hit the POST endpoint
if curl -s -X POST -H "Content-Type: application/json" -d "{\"agent_id\":\"$AGENT_ID\",\"secret_key\":\"$SECRET_KEY\"}" "$CONNECT_AGENT_URL"; then
    log_info "Host registered successfully"
else
    log_warn "Failed to register host active status. The service will still start."
fi

# Create systemd service file
echo "Creating systemd service..."

# Point to the python binary inside the virtual environment we just created
PYTHON_EXEC="$INSTALL_DIR/.venv/bin/python"

cat > "/etc/systemd/system/${SERVICE_NAME}.service" << EOF
[Unit]
Description=Hacker AI Agent Service
After=network.target network-online.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$PYTHON_EXEC $PYTHON_SCRIPT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="HOME=/root"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd daemon
echo "Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service to start on boot
echo "Enabling service to start on boot..."
systemctl enable "$SERVICE_NAME"

# Start the service
echo "Starting the service..."
systemctl start "$SERVICE_NAME"

# Check service status
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Service started successfully!"
else
    echo "Service failed to start. Check logs with: journalctl -u $SERVICE_NAME -f"
    exit 1
fi

echo "Installation Complete!"