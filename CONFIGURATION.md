# Configuration Guide for UI-mediamtx

This guide covers configuration options for MediaMTX and the UI application, including security, networking, and protocol settings.

## Table of Contents

- [MediaMTX Configuration](#mediamtx-configuration)
- [SRT Protocol Settings](#srt-protocol-settings)
- [RTSP Configuration](#rtsp-configuration)
- [Security and Authentication](#security-and-authentication)
- [Firewall Configuration](#firewall-configuration)
- [Advanced Configuration](#advanced-configuration)

## MediaMTX Configuration

MediaMTX stores its configuration in `./mediamtx-config/mediamtx.yml` (created on first run).

### Basic Configuration

Edit the configuration file:

```bash
nano ./mediamtx-config/mediamtx.yml
```

### Key Configuration Sections

#### API Settings

```yaml
# Enable API
api: yes

# API listen address
apiAddress: :9997

# Allow origin header for CORS (for web UI)
apiAllowOrigin: "*"
```

#### Protocol Settings

```yaml
# Supported protocols
protocols: [tcp, udp, srt]

# RTSP settings
rtspAddress: :8554
rtspEncryption: "no"  # Set to "optional" or "strict" for encryption

# SRT settings
srtAddress: :10000
```

#### Path Configuration

Paths define stream routes and can have individual settings:

```yaml
paths:
  # Default settings for all paths
  all:
    # Source type (publisher, redirect, etc.)
    # Empty means accept any publisher
    source: publisher
    
    # Recording settings
    record: no
    recordPath: /recordings/%path/%Y-%m-%d_%H-%M-%S
    
    # Authentication (optional)
    # readUser: viewer
    # readPass: viewpass
    # publishUser: publisher
    # publishPass: publishpass

  # Example: specific path with authentication
  secure:
    publishUser: admin
    publishPass: secretpass
    readUser: viewer
    readPass: viewpass
```

### Environment Variables

You can also configure MediaMTX using environment variables in `docker-compose.yml`:

```yaml
environment:
  # Enable API
  - MTX_API=yes
  - MTX_APIADDRESS=:9997
  
  # Protocols
  - MTX_PROTOCOLS=tcp,udp,srt
  - MTX_SRTADDRESS=:10000
  - MTX_RTSPADDRESS=:8554
  
  # Authentication for all paths
  - MTX_PATHS_ALL_READUSER=viewer
  - MTX_PATHS_ALL_READPASS=viewpass
  - MTX_PATHS_ALL_PUBLISHUSER=publisher
  - MTX_PATHS_ALL_PUBLISHPASS=publishpass
  
  # Recording
  - MTX_PATHS_ALL_RECORD=yes
  - MTX_PATHS_ALL_RECORDPATH=/recordings/%path/%Y-%m-%d_%H-%M-%S
```

## SRT Protocol Settings

SRT (Secure Reliable Transport) is optimized for low-latency streaming over unreliable networks.

### Basic SRT Configuration

```yaml
# SRT server address
srtAddress: :10000

# Encryption settings
srtEncryption: no  # Options: no, optional, strict
# srtPassphrase: yourpassphrase  # Required if encryption is enabled
```

### SRT Stream IDs

SRT uses stream IDs to identify publish/read operations:

**Publishing a stream**:
```
srt://server:10000?streamid=publish:mystream
```

**Reading a stream**:
```
srt://server:10000?streamid=read:mystream
```

### SRT Parameters

Common SRT parameters for streaming:

```bash
# Low latency streaming
ffmpeg -i input.mp4 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -c:a aac \
  -f mpegts "srt://server:10000?streamid=publish:mystream&latency=200"

# With encryption
ffmpeg -i input.mp4 \
  -c:v libx264 -preset ultrafast \
  -c:a aac \
  -f mpegts "srt://server:10000?streamid=publish:secure&passphrase=mypassword"
```

### SRT Firewall Rules

Ensure UDP port 10000 is open:

```bash
sudo ufw allow 10000/udp comment 'SRT streaming'
```

## RTSP Configuration

RTSP (Real Time Streaming Protocol) is widely supported by IP cameras and media players.

### Basic RTSP Configuration

```yaml
# RTSP server settings
rtspAddress: :8554

# Encryption
rtspEncryption: "no"  # Options: no, optional, strict

# Authentication
rtspAuthMethods: [basic, digest]
```

### RTSP URLs

**Publishing**:
```
rtsp://server:8554/mystream
```

**Viewing**:
```
rtsp://server:8554/mystream
```

**With authentication**:
```
rtsp://username:password@server:8554/mystream
```

### RTSP Firewall Rules

```bash
sudo ufw allow 8554/tcp comment 'RTSP streaming'
```

## Security and Authentication

### Enable Authentication

#### Method 1: Via Configuration File

Edit `mediamtx-config/mediamtx.yml`:

```yaml
paths:
  all:
    # Publisher authentication
    publishUser: publisher
    publishPass: strong_publish_password
    
    # Viewer authentication
    readUser: viewer
    readPass: strong_view_password
```

#### Method 2: Via Environment Variables

Update `docker-compose.yml`:

```yaml
services:
  mediamtx:
    environment:
      - MTX_PATHS_ALL_PUBLISHUSER=publisher
      - MTX_PATHS_ALL_PUBLISHPASS=${PUBLISH_PASSWORD}
      - MTX_PATHS_ALL_READUSER=viewer
      - MTX_PATHS_ALL_READPASS=${READ_PASSWORD}
```

Then set passwords in `.env`:

```bash
PUBLISH_PASSWORD=your_strong_publisher_password
READ_PASSWORD=your_strong_viewer_password
```

### Per-Path Authentication

Configure different credentials for different streams:

```yaml
paths:
  # Public stream (no authentication)
  public:
    source: publisher
    
  # Protected stream
  private:
    publishUser: admin
    publishPass: adminpass
    readUser: viewer
    readPass: viewpass
    
  # Camera stream with specific credentials
  camera1:
    publishUser: camera1
    publishPass: camera1pass
    readUser: viewer
    readPass: viewpass
```

### RTSP/SRT Encryption

#### Enable SRT Encryption

```yaml
srtEncryption: strict
srtPassphrase: your-encryption-passphrase
```

Update `.env`:
```bash
SRT_PASSPHRASE=your-encryption-passphrase
```

#### Enable RTSP Encryption (TLS)

Requires SSL certificates:

```yaml
rtspEncryption: strict
rtspServerCert: /config/server.crt
rtspServerKey: /config/server.key
```

Generate self-signed certificates (for testing):

```bash
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes
mv server.key server.crt ./mediamtx-config/
```

### API Authentication

Protect the MediaMTX API (recommended for production):

```yaml
api: yes
apiAddress: :9997

# Add authentication
paths:
  all:
    # This also protects API access
    readUser: apiuser
    readPass: apipassword
```

## Firewall Configuration

### Ubuntu/Debian with UFW

UFW (Uncomplicated Firewall) is the recommended firewall for Ubuntu/Debian.

#### Install UFW

```bash
sudo apt update
sudo apt install ufw
```

#### Configure UFW

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow Web UI
sudo ufw allow 3000/tcp comment 'UI-mediamtx Web UI'

# Allow MediaMTX API (only if needed externally)
sudo ufw allow 9997/tcp comment 'MediaMTX API'

# Allow RTSP
sudo ufw allow 8554/tcp comment 'RTSP streaming'

# Allow SRT
sudo ufw allow 10000/udp comment 'SRT streaming'

# Optional: Allow HLS
sudo ufw allow 8888/tcp comment 'HLS streaming'

# Optional: Allow WebRTC
sudo ufw allow 8889/tcp comment 'WebRTC'

# Enable UFW
sudo ufw enable

# Check status
sudo ufw status verbose
```

#### Restrict Access by IP

For production, restrict access to specific IPs:

```bash
# Allow SRT only from specific IP ranges
sudo ufw delete allow 10000/udp
sudo ufw allow from 192.168.1.0/24 to any port 10000 proto udp comment 'SRT from local network'

# Allow API only from localhost (secure)
sudo ufw delete allow 9997/tcp
sudo ufw allow from 127.0.0.1 to any port 9997 comment 'MediaMTX API local only'
```

### Advanced Firewall Rules

#### Rate Limiting

Protect against DoS attacks:

```bash
# Rate limit connections to Web UI
sudo ufw limit 3000/tcp comment 'Rate limit Web UI'
```

#### Port Knocking (Advanced)

For highly secure environments, use port knocking before opening streaming ports.

## Advanced Configuration

### Recording Streams

Enable automatic recording:

```yaml
paths:
  all:
    # Enable recording
    record: yes
    
    # Recording path with variables
    # %path = stream name
    # %Y-%m-%d = date
    # %H-%M-%S = time
    recordPath: /recordings/%path/%Y-%m-%d_%H-%M-%S.mp4
    
    # Recording format
    recordFormat: mp4  # Options: mp4, fmp4
    
    # Delete recordings after X hours (optional)
    # recordDeleteAfter: 24h
```

Mount the recordings directory:

```yaml
volumes:
  - ./mediamtx-recordings:/recordings
```

### Custom Paths with Proxying

Proxy external streams:

```yaml
paths:
  # Proxy an IP camera
  ipcamera:
    source: rtsp://username:password@192.168.1.100:554/stream1
    sourceOnDemand: yes  # Only connect when viewers request it
    
  # Proxy another RTSP server
  external:
    source: rtsp://external-server.com:554/live
    sourceProtocol: tcp
```

### WebRTC Configuration

Enable WebRTC for browser-based playback:

```yaml
webrtc: yes
webrtcAddress: :8889
webrtcICEServers:
  - url: stun:stun.l.google.com:19302
```

### HLS Configuration

Enable HLS for HTTP-based playback:

```yaml
hls: yes
hlsAddress: :8888
hlsAlwaysRemux: yes  # Always remux to HLS
hlsVariant: lowLatency  # Options: lowLatency, standard

paths:
  all:
    # Enable HLS for all paths
    hlsEnable: yes
```

### Resource Limits

Limit resource usage in `docker-compose.yml`:

```yaml
services:
  mediamtx:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### Logging Configuration

Configure log levels:

```yaml
# Log level
logLevel: info  # Options: debug, info, warn, error

# Log destinations
logDestinations: [stdout]  # Options: stdout, file, syslog

# If using file logging
# logFile: /config/mediamtx.log
```

In `docker-compose.yml`:

```yaml
services:
  mediamtx:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Network Optimization

For high-bandwidth streaming:

```yaml
# Increase read buffer sizes
readBufferCount: 512

# TCP settings for RTSP
rtspReadTimeout: 10s
rtspWriteTimeout: 10s

# UDP buffer size
udpMaxPayloadSize: 1472
```

### Restart Policies

Ensure services restart automatically:

```yaml
services:
  mediamtx:
    restart: unless-stopped
  
  ui-mediamtx:
    restart: unless-stopped
```

## Configuration Validation

After making changes, validate your configuration:

```bash
# Restart services
docker-compose restart

# Check logs for errors
docker-compose logs -f mediamtx

# Test API
curl http://localhost:9997/v3/config/get
```

## Backup Configuration

Regular backups are essential:

```bash
# Backup configuration
tar -czf mediamtx-config-backup-$(date +%Y%m%d).tar.gz mediamtx-config/

# Backup with environment file
tar -czf ui-mediamtx-backup-$(date +%Y%m%d).tar.gz mediamtx-config/ .env docker-compose.yml
```

## Troubleshooting Configuration

If services fail to start:

1. **Check logs**: `docker-compose logs mediamtx`
2. **Validate YAML**: Use a YAML validator for `mediamtx.yml`
3. **Check permissions**: Ensure config directories are writable
4. **Port conflicts**: Verify ports aren't already in use
5. **See**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more help

## Additional Resources

- [MediaMTX Configuration Reference](https://github.com/bluenviron/mediamtx#configuration)
- [SRT Protocol Documentation](https://github.com/Haivision/srt/blob/master/docs/API.md)
- [RTSP Specification](https://datatracker.ietf.org/doc/html/rfc2326)
- [UFW Documentation](https://help.ubuntu.com/community/UFW)
