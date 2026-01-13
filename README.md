# UI-mediamtx

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](https://www.docker.com/)
[![MediaMTX](https://img.shields.io/badge/MediaMTX-latest-orange.svg)](https://github.com/bluenviron/mediamtx)

A modern web-based user interface for [MediaMTX](https://github.com/bluenviron/mediamtx), a ready-to-use and zero-dependency real-time media server and proxy. UI-mediamtx provides an intuitive interface for managing media streams, monitoring performance, and configuring MediaMTX settings.

## 🌟 Features

- **🎛️ Stream Management**: Easy-to-use interface for managing multiple media streams
- **📊 Real-time Monitoring**: Live monitoring of active streams and server statistics
- **🔐 Security**: Built-in authentication and authorization support
- **📡 Multi-Protocol Support**: 
  - SRT (Secure Reliable Transport)
  - RTSP (Real Time Streaming Protocol)
  - HLS (HTTP Live Streaming)
  - WebRTC
- **🐳 Docker-Ready**: Pre-configured Docker Compose setup for quick deployment
- **⚙️ Configuration Management**: Manage MediaMTX settings through the web UI
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔄 API Integration**: Full integration with MediaMTX REST API

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Documentation](#documentation)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

Get up and running in minutes with Docker:

```bash
# Clone the repository
git clone https://github.com/Rjriva/UI-mediamtx.git
cd UI-mediamtx

# Copy and configure environment variables
cp .env.example .env
nano .env  # Update ADMIN_PASSWORD and other settings

# Start the services
docker-compose up -d

# Check status
docker-compose ps
```

Access the web UI at **http://localhost:3000**

## 📦 Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ / Debian 10+ (recommended) or any Docker-compatible system
- **CPU**: 2+ cores
- **RAM**: 2GB minimum, 4GB+ recommended
- **Storage**: 20GB minimum, 50GB+ for recordings
- **Network**: Stable internet connection

### Required Software

- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later

### Port Requirements

The following ports must be available:

| Port | Protocol | Service | Required |
|------|----------|---------|----------|
| 3000 | TCP | Web UI | Yes |
| 9997 | TCP | MediaMTX API | Yes |
| 8554 | TCP | RTSP | Yes |
| 10000 | UDP | SRT | Yes |
| 8888 | TCP | HLS | Optional |
| 8889 | TCP | WebRTC | Optional |

Check port availability:
```bash
sudo netstat -tuln | grep -E '3000|9997|8554|10000'
```

## 🔧 Installation

### Quick Installation (Ubuntu/Debian)

For detailed step-by-step instructions, see **[INSTALLATION.md](INSTALLATION.md)**.

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone and setup
git clone https://github.com/Rjriva/UI-mediamtx.git
cd UI-mediamtx
mkdir -p mediamtx-config mediamtx-recordings ui-app

# 4. Configure environment
cp .env.example .env
# Edit .env and change default passwords!
nano .env

# 5. Start services
docker-compose up -d

# 6. View logs
docker-compose logs -f
```

## 📖 Usage

### Accessing Services

- **Web UI**: http://localhost:3000
- **MediaMTX API**: http://localhost:9997
- **API Documentation**: http://localhost:9997/v3/docs

### Publishing a Stream

#### Using SRT (Secure Reliable Transport)

With FFmpeg:
```bash
ffmpeg -re -i input.mp4 \
  -c:v libx264 -preset ultrafast -b:v 3M \
  -c:a aac -b:a 128k \
  -f mpegts "srt://localhost:10000?streamid=publish:mystream"
```

With OBS Studio:
1. Settings → Stream
2. Service: Custom
3. Server: `srt://localhost:10000`
4. Stream Key: `publish:mystream`

#### Using RTSP

With FFmpeg:
```bash
ffmpeg -re -i input.mp4 \
  -c:v libx264 -preset ultrafast -b:v 3M \
  -c:a aac -b:a 128k \
  -f rtsp rtsp://localhost:8554/mystream
```

### Viewing a Stream

#### SRT Stream

```bash
# With FFplay
ffplay "srt://localhost:10000?streamid=read:mystream"

# With VLC
vlc "srt://localhost:10000?streamid=read:mystream"
```

#### RTSP Stream

```bash
# With FFplay
ffplay "rtsp://localhost:8554/mystream"

# With VLC
vlc "rtsp://localhost:8554/mystream"
```

### Managing Services

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update to latest version
docker-compose pull
docker-compose up -d
```

## 📚 Documentation

Comprehensive guides are available:

- **[INSTALLATION.md](INSTALLATION.md)** - Complete installation guide for Ubuntu/Debian
- **[CONFIGURATION.md](CONFIGURATION.md)** - MediaMTX configuration, security, and firewall setup
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[RECOMMENDATIONS.md](RECOMMENDATIONS.md)** - Production deployment best practices
- **[.env.example](.env.example)** - Environment variable reference

## ⚙️ Configuration

### Environment Variables

Key settings in `.env`:

```bash
# Security (CHANGE THESE!)
ADMIN_PASSWORD=changeme
PUBLISH_PASSWORD=changeme
READ_PASSWORD=changeme

# Ports
UI_PORT=3000
MEDIAMTX_API_PORT=9997
MEDIAMTX_SRT_PORT=10000
MEDIAMTX_RTSP_PORT=8554

# MediaMTX API URL
MEDIAMTX_API_URL=http://mediamtx:9997
```

See **[.env.example](.env.example)** for all available options.

### MediaMTX Configuration

MediaMTX configuration is stored in `./mediamtx-config/mediamtx.yml`.

Example configuration:

```yaml
api: yes
apiAddress: :9997

# Protocols
protocols: [tcp, udp, srt]
rtspAddress: :8554
srtAddress: :10000

# Authentication
paths:
  all:
    publishUser: publisher
    publishPass: secretpass
    readUser: viewer
    readPass: viewpass
```

See **[CONFIGURATION.md](CONFIGURATION.md)** for detailed configuration options.

## 🔒 Security

For production deployments, follow these security best practices:

1. **Change default passwords** in `.env`
2. **Enable firewall** (UFW recommended)
3. **Use HTTPS** with reverse proxy (nginx)
4. **Enable authentication** on MediaMTX
5. **Whitelist IP addresses** for publishers
6. **Enable SRT encryption** for secure streaming

See **[RECOMMENDATIONS.md](RECOMMENDATIONS.md#security-recommendations)** for complete security guidelines.

### Quick Firewall Setup

```bash
sudo apt install ufw
sudo ufw allow ssh
sudo ufw allow 3000/tcp
sudo ufw allow 8554/tcp
sudo ufw allow 10000/udp
sudo ufw enable
```

## 🧪 Testing

### Test Stream Generation

Generate a test pattern stream:

```bash
# Install FFmpeg if not already installed
sudo apt install ffmpeg

# Generate test stream
ffmpeg -re -f lavfi -i testsrc=size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=1000 \
  -c:v libx264 -preset ultrafast -b:v 2M \
  -c:a aac -b:a 128k \
  -f mpegts "srt://localhost:10000?streamid=publish:test"
```

View it:
```bash
ffplay "srt://localhost:10000?streamid=read:test"
```

Or via RTSP:
```bash
ffplay "rtsp://localhost:8554/test"
```

## 🐛 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs

# Verify ports are available
sudo netstat -tuln | grep -E '3000|9997|8554|10000'

# Check Docker status
sudo systemctl status docker
```

**Cannot access Web UI:**
```bash
# Check if container is running
docker-compose ps

# Check firewall
sudo ufw status

# Test locally
curl http://localhost:3000
```

**Stream connection fails:**
```bash
# Check if MediaMTX is healthy
curl http://localhost:9997/v3/config/get

# List active streams
curl http://localhost:9997/v3/paths/list

# Check logs
docker-compose logs mediamtx
```

See **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for comprehensive troubleshooting guide.

## 🏗️ Architecture

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │ HTTP :3000
         ▼
┌─────────────────┐      HTTP :9997      ┌──────────────┐
│  UI-mediamtx    │◄────────────────────►│   MediaMTX   │
│   (Node.js)     │                       │    Server    │
└─────────────────┘                       └──────┬───────┘
                                                 │
                              ┌──────────────────┼──────────────────┐
                              │                  │                  │
                          SRT :10000         RTSP :8554         HLS :8888
                              │                  │                  │
                         ┌────▼────┐        ┌────▼────┐       ┌────▼────┐
                         │ SRT Pub │        │ IP Cam  │       │ Browser │
                         │ (OBS)   │        │         │       │ Player  │
                         └─────────┘        └─────────┘       └─────────┘
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MediaMTX](https://github.com/bluenviron/mediamtx) - The powerful media server that powers this UI
- [Docker](https://www.docker.com/) - Container platform
- [Node.js](https://nodejs.org/) - JavaScript runtime

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Rjriva/UI-mediamtx/issues)
- **Documentation**: See docs in this repository
- **MediaMTX Docs**: [MediaMTX Documentation](https://github.com/bluenviron/mediamtx)

## 🔗 Related Projects

- [MediaMTX](https://github.com/bluenviron/mediamtx) - The underlying media server
- [OBS Studio](https://obsproject.com/) - Free streaming/recording software
- [FFmpeg](https://ffmpeg.org/) - Complete multimedia framework

## 📈 Roadmap

- [ ] Enhanced stream monitoring dashboard
- [ ] Recording management interface
- [ ] User management system
- [ ] Stream analytics and statistics
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Advanced stream routing

---

**Made with ❤️ for the streaming community**

If you find this project useful, please consider giving it a ⭐ on GitHub!
