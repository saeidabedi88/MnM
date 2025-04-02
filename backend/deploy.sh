#!/bin/bash

# Exit on error
set -e

echo "Starting deployment..."

# Update system
echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install dependencies
echo "Installing dependencies..."
sudo apt install -y python3-pip python3-venv nginx

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install Python dependencies
echo "Installing Python packages..."
pip install -r requirements.txt

# Create necessary directories
echo "Creating directories..."
sudo mkdir -p /var/log/ai-project-assistant
sudo chown -R ubuntu:ubuntu /var/log/ai-project-assistant

# Copy and configure environment file
echo "Configuring environment..."
cp deployment.env .env

# Set up systemd service
echo "Setting up systemd service..."
sudo tee /etc/systemd/system/ai-project-assistant.service << EOF
[Unit]
Description=AI Project Assistant API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/ai-project-assistant/backend
Environment="PATH=/home/ubuntu/ai-project-assistant/.venv/bin"
ExecStart=/home/ubuntu/ai-project-assistant/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/ai-project-assistant << EOF
server {
    listen 80;
    server_name api.your-domain.com;  # Replace with your domain

    access_log /var/log/nginx/ai-project-assistant-access.log;
    error_log /var/log/nginx/ai-project-assistant-error.log;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
echo "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/ai-project-assistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Start and enable the service
echo "Starting the service..."
sudo systemctl daemon-reload
sudo systemctl start ai-project-assistant
sudo systemctl enable ai-project-assistant

# Install and configure SSL
echo "Setting up SSL..."
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com --non-interactive --agree-tos --email your-email@example.com

echo "Deployment completed successfully!"
echo "Please update the following:"
echo "1. Edit .env file with your production values"
echo "2. Update the domain name in Nginx configuration"
echo "3. Update SSL certificate email in this script"
echo "4. Update CORS origins in .env to match your frontend domain" 