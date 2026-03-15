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
    source $HOME/.local/bin/env
else
    echo "uv is already installed"
fi

export PATH="$HOME/.cargo/bin:$PATH"

# Create installation directory
echo "Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Move the downloaded main.py script into place 
# The celery worker directly places main.py into /tmp/main.py before execution
mv /tmp/main.py "$INSTALL_DIR/$PYTHON_SCRIPT"
chmod +x "$INSTALL_DIR/$PYTHON_SCRIPT"

# Ensure dependencies are available
echo "Installing Python dependencies with uv..."
cd "$INSTALL_DIR"
uv pio add schedule requests
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

# Create systemd service file
echo "Creating systemd service..."
UV_PATH=$(which uv)
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
ExecStart=$UV_PATH run $PYTHON_SCRIPT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="HOME=/root"
Environment="PATH=$HOME/.cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

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
