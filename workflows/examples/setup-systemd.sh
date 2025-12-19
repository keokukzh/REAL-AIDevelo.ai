#!/bin/bash

# Setup Systemd timer for workflow orchestrator
# This script sets up a systemd service and timer for running workflows

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVICE_NAME="workflow-orchestrator"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TIMER_FILE="/etc/systemd/system/${SERVICE_NAME}.timer"

echo "Setting up Systemd service and timer for Workflow Orchestrator..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use sudo)"
  exit 1
fi

# Get user who will run the service
read -p "Enter username to run the service (default: $USER): " SERVICE_USER
SERVICE_USER=${SERVICE_USER:-$USER}

# Get project directory
read -p "Enter project directory (default: $PROJECT_DIR): " PROJECT_DIR_INPUT
PROJECT_DIR=${PROJECT_DIR_INPUT:-$PROJECT_DIR}

# Get Node.js path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  echo "Error: Node.js not found in PATH"
  exit 1
fi

# Get tsx path
TSX_PATH="$PROJECT_DIR/node_modules/.bin/tsx"
if [ ! -f "$TSX_PATH" ]; then
  echo "Error: tsx not found at $TSX_PATH"
  echo "Please run 'npm install' in the project directory"
  exit 1
fi

# Create service file
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Workflow Orchestrator Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
Environment="NODE_ENV=production"
ExecStart=$NODE_PATH $TSX_PATH $PROJECT_DIR/workflows/cli/cli.ts serve --port 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create timer file
cat > "$TIMER_FILE" <<EOF
[Unit]
Description=Workflow Orchestrator Timer
Requires=${SERVICE_NAME}.service

[Timer]
OnCalendar=*:0/5
Persistent=true
RandomizedDelaySec=60

[Install]
WantedBy=timers.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable and start timer
systemctl enable "${SERVICE_NAME}.timer"
systemctl start "${SERVICE_NAME}.timer"

echo ""
echo "✓ Systemd service and timer installed successfully"
echo ""
echo "Service file: $SERVICE_FILE"
echo "Timer file: $TIMER_FILE"
echo ""
echo "Useful commands:"
echo "  Check timer status: systemctl status ${SERVICE_NAME}.timer"
echo "  Check service status: systemctl status ${SERVICE_NAME}.service"
echo "  View logs: journalctl -u ${SERVICE_NAME}.service -f"
echo "  Stop timer: systemctl stop ${SERVICE_NAME}.timer"
echo "  Disable timer: systemctl disable ${SERVICE_NAME}.timer"
echo ""
