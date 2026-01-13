# Production Deployment Recommendations for UI-mediamtx

This guide provides best practices and recommendations for deploying UI-mediamtx in production environments.

## Table of Contents

- [System Requirements](#system-requirements)
- [Security Recommendations](#security-recommendations)
- [Performance Optimization](#performance-optimization)
- [Network Configuration](#network-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Backup and Disaster Recovery](#backup-and-disaster-recovery)
- [Scaling Strategies](#scaling-strategies)

## System Requirements

### Minimum Requirements

Suitable for testing or small-scale deployments (1-5 concurrent streams):

- **CPU**: 2 cores (2.0 GHz or higher)
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps connection
- **OS**: Ubuntu 20.04 LTS or later, Debian 10 or later

### Recommended Requirements

For production use (10-50 concurrent streams):

- **CPU**: 4+ cores (2.5 GHz or higher)
- **RAM**: 4-8GB
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps connection
- **OS**: Ubuntu 22.04 LTS (recommended)

### High-Performance Requirements

For large-scale deployments (50+ concurrent streams):

- **CPU**: 8+ cores (3.0 GHz or higher)
- **RAM**: 16GB+
- **Storage**: 100GB+ NVMe SSD
- **Network**: 10 Gbps connection or multiple 1 Gbps NICs
- **OS**: Ubuntu 22.04 LTS with kernel tuning

### Storage Considerations

If enabling stream recording:

- **Formula**: Concurrent Streams × Bitrate × Recording Duration × 1.2
- **Example**: 10 streams × 5 Mbps × 24h × 1.2 = ~650GB/day
- **Recommendation**: Use separate disk/partition for recordings
- **Implement**: Automated cleanup or archive to cloud storage

## Security Recommendations

### 1. Firewall Configuration

**Use UFW (Uncomplicated Firewall) on Ubuntu/Debian**:

```bash
# Install UFW
sudo apt update
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow ssh
sudo ufw limit ssh  # Rate limiting for SSH

# Allow only necessary ports
# Web UI (consider using reverse proxy with HTTPS instead)
sudo ufw allow 3000/tcp comment 'UI-mediamtx Web UI'

# RTSP
sudo ufw allow 8554/tcp comment 'RTSP streaming'

# SRT (limit by source IP for production)
sudo ufw allow from 192.168.1.0/24 to any port 10000 proto udp comment 'SRT from trusted network'

# MediaMTX API - restrict to localhost only
# (access via reverse proxy if needed externally)
sudo ufw deny 9997/tcp
sudo ufw allow from 127.0.0.1 to any port 9997

# Enable firewall
sudo ufw enable

# Verify
sudo ufw status numbered
```

### 2. Change Default Credentials

**Never use default passwords in production!**

Update `.env`:
```bash
# Generate strong passwords
ADMIN_PASSWORD=$(openssl rand -base64 32)
PUBLISH_PASSWORD=$(openssl rand -base64 32)
READ_PASSWORD=$(openssl rand -base64 32)

# Store securely
echo "ADMIN_PASSWORD=${ADMIN_PASSWORD}" >> .env.production
echo "PUBLISH_PASSWORD=${PUBLISH_PASSWORD}" >> .env.production
echo "READ_PASSWORD=${READ_PASSWORD}" >> .env.production
```

### 3. Enable HTTPS with Nginx Reverse Proxy

**Install Nginx and Certbot**:

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

**Create Nginx configuration**:

```bash
sudo nano /etc/nginx/sites-available/ui-mediamtx
```

Add:
```nginx
server {
    server_name your-domain.com;

    # Web UI
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # MediaMTX API (optional - for external access)
    location /api/ {
        proxy_pass http://localhost:9997/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Optional: Basic auth for API
        # auth_basic "MediaMTX API";
        # auth_basic_user_file /etc/nginx/.htpasswd;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    listen 80;
}
```

**Enable site and get SSL certificate**:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ui-mediamtx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### 4. IP Whitelisting for SRT Sources

Restrict SRT publishers to known IP addresses:

**Option 1: UFW Rules**
```bash
# Remove blanket SRT allow rule
sudo ufw delete allow 10000/udp

# Allow only specific IPs
sudo ufw allow from 203.0.113.10 to any port 10000 proto udp comment 'SRT Publisher 1'
sudo ufw allow from 203.0.113.11 to any port 10000 proto udp comment 'SRT Publisher 2'
```

**Option 2: MediaMTX Configuration**
```yaml
paths:
  trusted_publisher:
    publishIPs: [203.0.113.10, 203.0.113.11]
```

### 5. Enable SRT Encryption

Update MediaMTX configuration:

```yaml
# SRT encryption
srtEncryption: strict
srtPassphrase: your-strong-encryption-passphrase
```

Use in FFmpeg:
```bash
ffmpeg -i input.mp4 -f mpegts "srt://server:10000?streamid=publish:secure&passphrase=your-strong-encryption-passphrase"
```

### 6. Implement Rate Limiting

Protect against DDoS attacks:

```bash
# Rate limit Web UI connections
sudo ufw limit 3000/tcp

# Or use nginx rate limiting
# In nginx config:
limit_req_zone $binary_remote_addr zone=ui_limit:10m rate=10r/s;

server {
    location / {
        limit_req zone=ui_limit burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

### 7. Regular Security Updates

```bash
# Automate security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Manual updates
sudo apt update
sudo apt upgrade

# Update Docker images regularly
docker-compose pull
docker-compose up -d
```

### 8. Secure Docker Socket

Never expose Docker socket to containers:

```yaml
# DON'T do this in production:
# volumes:
#   - /var/run/docker.sock:/var/run/docker.sock
```

## Performance Optimization

### 1. Docker Resource Limits

Set appropriate limits in `docker-compose.yml`:

```yaml
services:
  mediamtx:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '2.0'
          memory: 2G
    
  ui-mediamtx:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### 2. Enable Container Restart Policies

Ensure services auto-restart:

```yaml
services:
  mediamtx:
    restart: unless-stopped
    
  ui-mediamtx:
    restart: unless-stopped
```

### 3. Optimize MediaMTX Buffer Sizes

Edit `mediamtx-config/mediamtx.yml`:

```yaml
# Increase buffers for high-throughput
readBufferCount: 1024
readBufferSize: 2048

# UDP buffer size (for SRT)
udpMaxPayloadSize: 1472

# RTSP timeouts
rtspReadTimeout: 10s
rtspWriteTimeout: 10s
```

### 4. Enable Log Rotation

Prevent logs from filling disk:

```yaml
services:
  mediamtx:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
        compress: "true"
        
  ui-mediamtx:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
        compress: "true"
```

### 5. Use Bind Mounts for Persistence

For better performance than named volumes:

```yaml
volumes:
  # Instead of named volumes, use bind mounts
  - /srv/mediamtx/config:/config
  - /srv/mediamtx/recordings:/recordings
```

Create directories:
```bash
sudo mkdir -p /srv/mediamtx/{config,recordings}
sudo chown -R 1000:1000 /srv/mediamtx
```

### 6. System-Level Optimizations

**Increase system limits**:

```bash
# Edit limits
sudo nano /etc/security/limits.conf
```

Add:
```
* soft nofile 65536
* hard nofile 65536
* soft nproc 4096
* hard nproc 4096
```

**Optimize network stack**:

```bash
sudo nano /etc/sysctl.conf
```

Add:
```
# Increase network buffers
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.rmem_default = 16777216
net.core.wmem_default = 16777216
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864

# Increase connection tracking
net.netfilter.nf_conntrack_max = 262144

# Enable TCP Fast Open
net.ipv4.tcp_fastopen = 3
```

Apply:
```bash
sudo sysctl -p
```

## Network Configuration

### 1. Port Forwarding for Remote Access

If behind NAT/router, forward ports:

| Internal Port | External Port | Protocol | Service |
|--------------|---------------|----------|---------|
| 3000 | 3000 | TCP | Web UI |
| 8554 | 8554 | TCP | RTSP |
| 10000 | 10000 | UDP | SRT |

### 2. VPN for Secure Remote Management

**WireGuard VPN Setup** (recommended):

```bash
# Install WireGuard
sudo apt install wireguard

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure WireGuard
sudo nano /etc/wireguard/wg0.conf
```

Access services via VPN tunnel instead of exposing to internet.

### 3. SSH Tunnel for Secure Access

For temporary access:

```bash
# On client machine, create SSH tunnel
ssh -L 3000:localhost:3000 user@server-ip

# Access UI at http://localhost:3000 on client
```

### 4. Load Balancing for Multiple Servers

Use Nginx as load balancer:

```nginx
upstream mediamtx_backend {
    least_conn;
    server server1.example.com:8554;
    server server2.example.com:8554;
    server server3.example.com:8554;
}

server {
    listen 8554;
    location / {
        proxy_pass http://mediamtx_backend;
    }
}
```

## Monitoring and Maintenance

### 1. Health Checks

Already configured in docker-compose.yml:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9997/v3/config/get"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

Check health status:
```bash
docker-compose ps
docker inspect mediamtx | jq '.[0].State.Health'
```

### 2. Monitoring Tools

**Prometheus + Grafana** (recommended):

```yaml
# Add to docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**Or use simple monitoring script**:

```bash
#!/bin/bash
# monitor.sh - Simple monitoring script

echo "=== Container Status ==="
docker-compose ps

echo -e "\n=== Resource Usage ==="
docker stats --no-stream

echo -e "\n=== Disk Usage ==="
df -h | grep -E 'Filesystem|/srv/mediamtx'

echo -e "\n=== Active Streams ==="
curl -s http://localhost:9997/v3/paths/list | jq '.items | length'

echo -e "\n=== Memory Available ==="
free -h
```

Run via cron every 5 minutes:
```bash
crontab -e
# Add:
*/5 * * * * /path/to/monitor.sh >> /var/log/mediamtx-monitor.log 2>&1
```

### 3. Alert Configuration

**Simple email alerts**:

```bash
#!/bin/bash
# check_health.sh

if ! docker-compose ps | grep -q "Up (healthy)"; then
    echo "MediaMTX container unhealthy!" | mail -s "MediaMTX Alert" admin@example.com
fi
```

### 4. Log Management

**Centralized logging with Loki** (optional):

```yaml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki-data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
```

## Backup and Disaster Recovery

### 1. Backup Strategy

**What to backup**:
- Configuration files (`mediamtx-config/`)
- Environment variables (`.env`)
- Docker Compose file (`docker-compose.yml`)
- Recordings (if enabled)

**Automated backup script**:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/mediamtx"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mediamtx_backup_${DATE}.tar.gz"

mkdir -p $BACKUP_DIR

# Stop containers (optional, for consistency)
# docker-compose stop

# Create backup
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" \
    mediamtx-config/ \
    .env \
    docker-compose.yml

# Restart containers if stopped
# docker-compose start

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mediamtx_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}"
```

**Schedule daily backups**:
```bash
crontab -e
# Add:
0 2 * * * /path/to/backup.sh >> /var/log/mediamtx-backup.log 2>&1
```

### 2. Cloud Backup

Sync to cloud storage:

```bash
# Install rclone
sudo apt install rclone

# Configure (e.g., for S3, Google Drive, etc.)
rclone config

# Sync backups
rclone sync /backup/mediamtx remote:mediamtx-backups
```

### 3. Disaster Recovery Plan

**Recovery steps**:

1. **Fresh installation**:
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
```

2. **Restore backup**:
```bash
# Download latest backup
rclone copy remote:mediamtx-backups/latest.tar.gz .

# Extract
tar -xzf latest.tar.gz

# Start services
docker-compose up -d
```

3. **Verify**:
```bash
docker-compose ps
curl http://localhost:9997/v3/config/get
```

### 4. Configuration Version Control

Use Git for configuration tracking:

```bash
# Initialize git repo
git init
git add docker-compose.yml mediamtx-config/
git commit -m "Initial configuration"

# After changes
git add -A
git commit -m "Updated configuration"

# Push to private repository
git remote add origin git@github.com:yourname/mediamtx-config-private.git
git push -u origin main
```

## Scaling Strategies

### Vertical Scaling

Increase resources on single server:

```yaml
services:
  mediamtx:
    deploy:
      resources:
        limits:
          cpus: '8.0'
          memory: 16G
```

### Horizontal Scaling

Deploy multiple MediaMTX instances:

1. **Use load balancer** (nginx, HAProxy)
2. **Distribute streams** across instances
3. **Implement service discovery**

### CDN Integration

For large-scale distribution:

1. Enable HLS in MediaMTX
2. Sync HLS segments to CDN
3. Serve playback via CDN

## Update Procedure

### Regular Updates

```bash
# 1. Backup current configuration
./backup.sh

# 2. Pull latest images
docker-compose pull

# 3. Recreate containers with new images
docker-compose up -d

# 4. Verify
docker-compose ps
docker-compose logs -f

# 5. Test functionality
curl http://localhost:9997/v3/config/get
```

### Rollback Procedure

If update fails:

```bash
# Stop current containers
docker-compose down

# Restore previous images
docker-compose pull <previous-version>

# Restore configuration from backup
tar -xzf backup.tar.gz

# Start with previous version
docker-compose up -d
```

## Checklist for Production Deployment

- [ ] System requirements met
- [ ] Firewall configured with UFW
- [ ] Default passwords changed
- [ ] HTTPS enabled with valid certificate
- [ ] Authentication enabled on MediaMTX
- [ ] SRT encryption enabled (if using SRT)
- [ ] IP whitelisting configured
- [ ] Resource limits set in docker-compose.yml
- [ ] Log rotation enabled
- [ ] Automated backups configured
- [ ] Monitoring set up
- [ ] Alert system configured
- [ ] Documentation reviewed
- [ ] Disaster recovery plan tested
- [ ] Security audit completed
- [ ] Performance baseline established

## Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [MediaMTX Performance Tuning](https://github.com/bluenviron/mediamtx#performance)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [UFW Documentation](https://help.ubuntu.com/community/UFW)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
