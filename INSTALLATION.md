# Installation Guide for UI-mediamtx

This guide provides step-by-step instructions for installing and running UI-mediamtx on Ubuntu/Debian systems using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Configuration](#configuration)
- [Starting the Application](#starting-the-application)
- [Verifying Installation](#verifying-installation)
- [Accessing the Application](#accessing-the-application)
- [Next Steps](#next-steps)

## Prerequisites

### System Requirements

- Ubuntu 20.04 LTS or later / Debian 10 or later
- Minimum 2 CPU cores
- Minimum 2GB RAM
- At least 20GB free disk space
- Root or sudo access

### Port Requirements

Ensure the following ports are available (not used by other services):

- **3000**: Web UI
- **9997**: MediaMTX API
- **8554**: RTSP streaming
- **10000**: SRT streaming (UDP)
- **8888**: HLS streaming (optional)
- **8889**: WebRTC (optional)

Check if ports are in use:
```bash
sudo netstat -tuln | grep -E '3000|9997|8554|10000|8888|8889'
```

If any ports are in use, you'll need to either stop the conflicting service or modify the port mappings in `docker-compose.yml`.

## Installation Steps

### Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Docker

Install Docker using the official installation script:

```bash
# Download the Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Run the installation script
sudo sh get-docker.sh

# Add your user to the docker group (to run Docker without sudo)
sudo usermod -aG docker $USER

# Clean up the installation script
rm get-docker.sh
```

**Important**: Log out and log back in for the group changes to take effect, or run:
```bash
newgrp docker
```

Verify Docker installation:
```bash
docker --version
docker run hello-world
```

### Step 3: Install Docker Compose

Docker Compose v2 comes bundled with Docker Desktop, but on Linux servers, you may need to install it separately:

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Create a symbolic link (optional, for 'docker-compose' command)
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
```

Verify Docker Compose installation:
```bash
docker-compose --version
```

### Step 4: Clone the Repository

```bash
# Clone the UI-mediamtx repository
git clone https://github.com/Rjriva/UI-mediamtx.git

# Navigate to the project directory
cd UI-mediamtx
```

### Step 5: Create Required Directories

Create directories for persistent data storage:

```bash
# Create directories for MediaMTX configuration and recordings
mkdir -p mediamtx-config
mkdir -p mediamtx-recordings

# Create directory for the UI application (if it doesn't exist)
mkdir -p ui-app
```

### Step 6: Configure Environment Variables

Copy the example environment file and customize it:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

**Important settings to update in `.env`**:
- `ADMIN_PASSWORD`: Change from default "changeme" to a strong password
- `MEDIAMTX_API_URL`: Keep as `http://mediamtx:9997` for Docker networking
- `EXTERNAL_HOST`: Set to your domain or IP if accessing remotely

Save and exit the editor (Ctrl+X, then Y, then Enter in nano).

### Step 7: Review and Customize docker-compose.yml

Review the `docker-compose.yml` file and adjust if needed:

```bash
nano docker-compose.yml
```

Common customizations:
- **Port mappings**: Change external ports if there are conflicts
- **Volume paths**: Adjust paths for configuration and recordings storage
- **Resource limits**: Add CPU and memory limits for production (see [RECOMMENDATIONS.md](RECOMMENDATIONS.md))

## Configuration

### MediaMTX Configuration

On first run, MediaMTX will create a default configuration file in `./mediamtx-config/`. You can customize this later.

For detailed configuration options, see [CONFIGURATION.md](CONFIGURATION.md).

### UI Application Setup

**Important**: The `ui-mediamtx` service in `docker-compose.yml` is a template that expects you to provide your own UI application code.

If you're developing a custom UI application:

1. Place your UI application code in the `./ui-app` directory
2. Ensure it has a `package.json` with a `start` script
3. Configure it to connect to MediaMTX API at the URL specified in `.env`

**Example minimal UI app structure**:
```
ui-app/
├── package.json
├── index.js
└── public/
    └── index.html
```

**Note**: If you don't have a UI application ready, you can:
- Comment out the `ui-mediamtx` service in `docker-compose.yml` and just run MediaMTX
- Access MediaMTX directly via its API at http://localhost:9997
- Use the MediaMTX built-in web interface (if available in your version)

For production deployments, replace the simple `command` with a proper Dockerfile that pre-installs dependencies.

## Starting the Application

### Start Services

Start all services in detached mode:

```bash
docker-compose up -d
```

This will:
1. Pull the necessary Docker images (first time only)
2. Create the network and volumes
3. Start the MediaMTX container
4. Wait for MediaMTX to be healthy
5. Start the UI container

### Monitor Startup

Watch the logs to ensure everything starts correctly:

```bash
# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f mediamtx
docker-compose logs -f ui-mediamtx
```

Press `Ctrl+C` to stop following logs.

## Verifying Installation

### Check Container Status

```bash
docker-compose ps
```

You should see both containers running with status "Up" and healthy.

### Verify Ports are Listening

```bash
# Check if ports are listening
sudo netstat -tuln | grep -E '3000|9997|8554|10000'

# Or using ss command
sudo ss -tuln | grep -E '3000|9997|8554|10000'
```

Expected output should show all ports in LISTEN state.

### Test API Connectivity

Test the MediaMTX API:

```bash
# Get MediaMTX configuration (should return JSON)
curl http://localhost:9997/v3/config/get

# List paths/streams
curl http://localhost:9997/v3/paths/list
```

### Test Web UI

Open a web browser and navigate to:
```
http://localhost:3000
```

Or test with curl:
```bash
curl -I http://localhost:3000
```

## Accessing the Application

### Local Access

- **Web UI**: http://localhost:3000
- **MediaMTX API**: http://localhost:9997
- **SRT Streaming**: `srt://localhost:10000`
- **RTSP Streaming**: `rtsp://localhost:8554/<stream-name>`

### Remote Access

If accessing from another machine:

1. **Configure Firewall**: See [CONFIGURATION.md](CONFIGURATION.md#firewall-configuration)
2. **Use Server IP**: Replace `localhost` with your server's IP address or domain
3. **Security**: Consider using a reverse proxy with HTTPS (see [RECOMMENDATIONS.md](RECOMMENDATIONS.md#security-recommendations))

Example remote URLs:
- Web UI: `http://your-server-ip:3000`
- SRT: `srt://your-server-ip:10000`
- RTSP: `rtsp://your-server-ip:8554/<stream-name>`

## Next Steps

✅ Installation complete! Here's what to do next:

1. **Configure MediaMTX**: Review [CONFIGURATION.md](CONFIGURATION.md) for advanced settings
2. **Set up Security**: Enable authentication and configure firewall (see [RECOMMENDATIONS.md](RECOMMENDATIONS.md))
3. **Test Streaming**: Send a test stream via SRT or RTSP
4. **Production Setup**: Review [RECOMMENDATIONS.md](RECOMMENDATIONS.md) for production deployment
5. **Troubleshooting**: If you encounter issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Quick Test Stream

Test with FFmpeg (if installed):

```bash
# Send test pattern to MediaMTX via SRT
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 -f lavfi -i sine=frequency=1000 \
  -c:v libx264 -preset ultrafast -b:v 2M -c:a aac -b:a 128k \
  -f mpegts "srt://localhost:10000?streamid=publish:test"
```

Then view it:
```bash
# View with ffplay (if installed)
ffplay "srt://localhost:10000?streamid=read:test"

# Or via RTSP
ffplay "rtsp://localhost:8554/test"
```

## Stopping and Managing Services

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart a specific service
docker-compose restart mediamtx
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

## Uninstallation

To completely remove UI-mediamtx:

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove project directory
cd ..
rm -rf UI-mediamtx

# Optional: Remove Docker images
docker image rm bluenviron/mediamtx:latest
docker image rm node:18-alpine
```

## Additional Resources

- [MediaMTX Documentation](https://github.com/bluenviron/mediamtx)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SRT Protocol](https://www.srtalliance.org/)

## Getting Help

If you encounter issues:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review container logs: `docker-compose logs`
3. Check the [GitHub Issues](https://github.com/Rjriva/UI-mediamtx/issues)
4. Consult the [MediaMTX documentation](https://github.com/bluenviron/mediamtx)
