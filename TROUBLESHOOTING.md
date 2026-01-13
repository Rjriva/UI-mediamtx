# Troubleshooting Guide for UI-mediamtx

This guide helps you diagnose and resolve common issues with UI-mediamtx and MediaMTX.

## Table of Contents

- [Docker Issues](#docker-issues)
- [Port Conflicts](#port-conflicts)
- [Permission Issues](#permission-issues)
- [Network Connectivity](#network-connectivity)
- [Streaming Issues](#streaming-issues)
- [Container Issues](#container-issues)
- [Log Files and Debugging](#log-files-and-debugging)
- [Performance Issues](#performance-issues)

## Docker Issues

### Docker Daemon Not Running

**Symptoms**: Error message "Cannot connect to the Docker daemon"

**Solution**:
```bash
# Check Docker status
sudo systemctl status docker

# Start Docker if not running
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker
```

### Permission Denied When Running Docker

**Symptoms**: "permission denied while trying to connect to the Docker daemon socket"

**Solution**:
```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the changes (or log out and back in)
newgrp docker

# Verify
docker ps
```

### Docker Compose Command Not Found

**Symptoms**: "docker-compose: command not found"

**Solution**:
```bash
# Check if Docker Compose is installed
docker compose version  # V2 (built-in)
docker-compose --version  # V1 (standalone)

# If not installed, install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Or use 'docker compose' (V2 command) instead of 'docker-compose'
```

### Out of Disk Space

**Symptoms**: "no space left on device"

**Solution**:
```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove old images
docker image prune -a

# Check specific container disk usage
docker system df
```

### Image Pull Failures

**Symptoms**: "Error pulling image" or timeout errors

**Solution**:
```bash
# Check internet connectivity
ping -c 4 google.com

# Try pulling images manually
docker pull bluenviron/mediamtx:latest
docker pull node:18-alpine

# If behind a proxy, configure Docker proxy settings
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo nano /etc/systemd/system/docker.service.d/http-proxy.conf

# Add:
# [Service]
# Environment="HTTP_PROXY=http://proxy.example.com:8080"
# Environment="HTTPS_PROXY=http://proxy.example.com:8080"

# Restart Docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## Port Conflicts

### Port Already in Use

**Symptoms**: "bind: address already in use" or "port is already allocated"

**Solution**:

```bash
# Identify which process is using the port
sudo netstat -tuln | grep <port>
# Or
sudo lsof -i :<port>
# Or
sudo ss -tuln | grep <port>

# Example for port 3000
sudo lsof -i :3000

# Stop the conflicting service
sudo systemctl stop <service-name>
# Or kill the process
sudo kill <PID>

# Or modify docker-compose.yml to use different ports
# Example: Change "3000:3000" to "3001:3000"
```

### Common Port Conflicts

| Port | Common Conflicts | Solution |
|------|------------------|----------|
| 3000 | Node.js apps, Rails | Change to 3001:3000 |
| 8554 | Other RTSP servers | Change to 8555:8554 |
| 9997 | Other APIs | Change to 9998:9997 |
| 10000 | Other applications | Change to 10001:10000 |

**Modify ports in docker-compose.yml**:
```yaml
ports:
  - "3001:3000"  # External:Internal
```

### Checking All Listening Ports

```bash
# List all listening ports
sudo netstat -tuln

# Or with ss
sudo ss -tuln

# Check only specific ports used by UI-mediamtx
sudo netstat -tuln | grep -E '3000|9997|8554|10000'
```

## Permission Issues

### Cannot Create Directories

**Symptoms**: "Permission denied" when creating config or recording directories

**Solution**:
```bash
# Check current permissions
ls -la

# Fix ownership
sudo chown -R $USER:$USER ./mediamtx-config ./mediamtx-recordings ./ui-app

# Or create with correct permissions
mkdir -p mediamtx-config mediamtx-recordings ui-app
chmod 755 mediamtx-config mediamtx-recordings ui-app
```

### Volume Mount Permission Errors

**Symptoms**: Container fails with "permission denied" accessing mounted volumes

**Solution**:

**Option 1**: Fix host directory permissions
```bash
sudo chown -R 1000:1000 ./mediamtx-config ./mediamtx-recordings
chmod -R 755 ./mediamtx-config ./mediamtx-recordings
```

**Option 2**: Update docker-compose.yml with user mapping
```yaml
services:
  mediamtx:
    user: "${UID}:${GID}"
```

Then run:
```bash
export UID=$(id -u)
export GID=$(id -g)
docker-compose up -d
```

### SELinux Issues (CentOS/RHEL/Fedora)

**Symptoms**: Permission denied errors on systems with SELinux enabled

**Solution**:
```bash
# Check SELinux status
sestatus

# Fix context for volumes
sudo chcon -Rt svirt_sandbox_file_t ./mediamtx-config ./mediamtx-recordings

# Or temporarily set SELinux to permissive (not recommended for production)
sudo setenforce 0
```

## Network Connectivity

### Cannot Access Web UI

**Symptoms**: Browser shows "Connection refused" or timeout when accessing http://localhost:3000

**Diagnosis**:
```bash
# Check if container is running
docker-compose ps

# Check if port is listening
sudo netstat -tuln | grep 3000

# Check container logs
docker-compose logs ui-mediamtx

# Test from server itself
curl http://localhost:3000
```

**Solutions**:

1. **Container not running**:
```bash
docker-compose up -d
docker-compose logs -f ui-mediamtx
```

2. **Firewall blocking**:
```bash
# Check UFW status
sudo ufw status

# Allow port 3000
sudo ufw allow 3000/tcp
```

3. **Wrong bind address**:
Ensure `docker-compose.yml` has:
```yaml
ports:
  - "3000:3000"  # Not "127.0.0.1:3000:3000"
```

### Cannot Access from Remote Machine

**Symptoms**: Works on localhost but not from other machines

**Solution**:
```bash
# Check if server is listening on all interfaces
sudo netstat -tuln | grep 3000
# Should show "0.0.0.0:3000" not "127.0.0.1:3000"

# Check firewall
sudo ufw status
sudo ufw allow from <client-ip> to any port 3000

# If using cloud provider, check security groups/firewall rules

# Test connectivity from client
telnet <server-ip> 3000
# Or
nc -zv <server-ip> 3000
```

### MediaMTX API Not Accessible

**Symptoms**: UI cannot connect to MediaMTX API

**Diagnosis**:
```bash
# Test API from host
curl http://localhost:9997/v3/config/get

# Test from inside UI container
docker exec ui-mediamtx wget -q -O- http://mediamtx:9997/v3/config/get
```

**Solution**:

Check `.env` has correct API URL:
```bash
# For Docker networking
MEDIAMTX_API_URL=http://mediamtx:9997

# NOT localhost when in Docker
# MEDIAMTX_API_URL=http://localhost:9997  # Wrong!
```

### DNS Resolution Issues

**Symptoms**: "Name or service not known" errors

**Solution**:
```bash
# Test DNS from container
docker exec ui-mediamtx ping -c 2 mediamtx

# If fails, ensure containers are on same network
docker network ls
docker network inspect ui-mediamtx_mediamtx-network

# Restart with network recreation
docker-compose down
docker-compose up -d
```

## Streaming Issues

### Cannot Publish Stream via SRT

**Symptoms**: FFmpeg or encoder fails to publish to SRT port

**Diagnosis**:
```bash
# Check if SRT port is listening
sudo netstat -uln | grep 10000

# Check MediaMTX logs
docker-compose logs mediamtx | grep -i srt

# Test with FFmpeg
ffmpeg -re -f lavfi -i testsrc -f mpegts "srt://localhost:10000?streamid=publish:test"
```

**Solutions**:

1. **Port not open**:
```bash
sudo ufw allow 10000/udp
```

2. **Wrong stream ID format**:
```bash
# Correct format
srt://server:10000?streamid=publish:mystream

# NOT
srt://server:10000/mystream
```

3. **SRT not enabled in MediaMTX**:
Check `docker-compose.yml` has:
```yaml
environment:
  - MTX_PROTOCOLS=tcp,udp,srt
  - MTX_SRTADDRESS=:10000
```

4. **Firewall blocking UDP**:
```bash
# Check iptables rules
sudo iptables -L -n -v | grep 10000

# Allow UDP port
sudo ufw allow 10000/udp
```

### Cannot View Stream via RTSP

**Symptoms**: VLC or media player cannot connect to RTSP stream

**Diagnosis**:
```bash
# Check if stream exists
curl http://localhost:9997/v3/paths/list

# Check RTSP port
sudo netstat -tln | grep 8554

# Test with FFplay
ffplay rtsp://localhost:8554/test
```

**Solutions**:

1. **Stream not published yet**:
```bash
# Publish a test stream first
ffmpeg -re -f lavfi -i testsrc -f rtsp rtsp://localhost:8554/test
```

2. **Wrong stream name**:
```bash
# List available streams
curl http://localhost:9997/v3/paths/list | jq
```

3. **Authentication required**:
```bash
# Use credentials in URL
rtsp://username:password@localhost:8554/streamname
```

4. **TCP vs UDP transport**:
```bash
# Try TCP transport
ffplay -rtsp_transport tcp rtsp://localhost:8554/test
```

### Stream Stuttering or Buffering

**Symptoms**: Playback is choppy or keeps buffering

**Solutions**:

1. **Reduce encoding bitrate**:
```bash
ffmpeg ... -b:v 2M ...  # Lower bitrate
```

2. **Use lower latency settings**:
```bash
# SRT with lower latency
srt://server:10000?streamid=publish:test&latency=200
```

3. **Check CPU usage**:
```bash
# Monitor container resources
docker stats

# Check system resources
htop
```

4. **Network issues**:
```bash
# Test network speed
iperf3 -c <server>

# Check packet loss
ping -c 100 <server>
```

## Container Issues

### Container Exits Immediately

**Symptoms**: Container status shows "Exited (1)" or similar

**Diagnosis**:
```bash
# Check exit code and logs
docker-compose ps
docker-compose logs mediamtx
docker-compose logs ui-mediamtx

# See last container run
docker logs <container-id>
```

**Common Causes**:

1. **Configuration error**:
```bash
# Check for YAML syntax errors
docker-compose config
```

2. **Missing dependencies**:
```bash
# For UI container, check package.json
docker-compose logs ui-mediamtx | grep -i error
```

3. **Wrong command**:
Check `command:` in docker-compose.yml is correct

### Container Unhealthy

**Symptoms**: `docker-compose ps` shows container as "unhealthy"

**Diagnosis**:
```bash
# Check health check results
docker inspect mediamtx | jq '.[0].State.Health'

# View health check logs
docker inspect mediamtx | jq '.[0].State.Health.Log'
```

**Solution**:
```bash
# Check if the health check endpoint works
curl http://localhost:9997/v3/config/get

# Restart container
docker-compose restart mediamtx

# If persists, check logs
docker-compose logs mediamtx
```

### Container Resource Issues

**Symptoms**: Container is slow or gets killed

**Diagnosis**:
```bash
# Monitor resource usage
docker stats

# Check container limits
docker inspect mediamtx | jq '.[0].HostConfig.Memory'
```

**Solution**: Add resource limits in docker-compose.yml
```yaml
services:
  mediamtx:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

## Log Files and Debugging

### View Logs

```bash
# All services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs mediamtx
docker-compose logs ui-mediamtx

# Last N lines
docker-compose logs --tail=100 mediamtx

# With timestamps
docker-compose logs -t mediamtx

# Save logs to file
docker-compose logs > logs.txt
```

### Enable Debug Logging

**MediaMTX**: Edit mediamtx-config/mediamtx.yml:
```yaml
logLevel: debug
```

**Docker Compose**: Add environment variable:
```yaml
services:
  mediamtx:
    environment:
      - MTX_LOGLEVEL=debug
```

Restart services:
```bash
docker-compose restart
```

### Container Shell Access

```bash
# Access MediaMTX container shell
docker exec -it mediamtx sh

# Access UI container shell
docker exec -it ui-mediamtx sh

# Run commands in container
docker exec mediamtx ls -la /config
```

### Common Log Messages

| Log Message | Meaning | Solution |
|-------------|---------|----------|
| "bind: address already in use" | Port conflict | Change port or stop conflicting service |
| "connection refused" | Service not ready | Wait for service to start, check depends_on |
| "permission denied" | File/directory access issue | Fix permissions with chown/chmod |
| "no route to host" | Network connectivity issue | Check firewall, network config |
| "stream not found" | Stream doesn't exist | Verify stream is published |

### Accessing MediaMTX Configuration

```bash
# View current config
cat ./mediamtx-config/mediamtx.yml

# Or via API
curl http://localhost:9997/v3/config/get | jq
```

## Performance Issues

### High CPU Usage

**Diagnosis**:
```bash
# Monitor CPU
docker stats

# Check processes in container
docker exec mediamtx top
```

**Solutions**:

1. Reduce stream quality/bitrate
2. Limit number of concurrent streams
3. Add resource limits
4. Upgrade server hardware

### High Memory Usage

**Diagnosis**:
```bash
# Check memory usage
docker stats
free -h
```

**Solutions**:

1. Add memory limits in docker-compose.yml
2. Reduce buffer sizes in MediaMTX config
3. Enable log rotation
4. Increase server RAM

### Slow Network Performance

**Diagnosis**:
```bash
# Test network speed
iperf3 -s  # On server
iperf3 -c <server-ip>  # On client

# Monitor network usage
docker stats
```

**Solutions**:

1. Check network bandwidth
2. Use lower bitrates
3. Enable stream caching
4. Use CDN for distribution

## Getting Additional Help

If you still have issues after trying these solutions:

1. **Check Documentation**:
   - [MediaMTX Documentation](https://github.com/bluenviron/mediamtx)
   - [Docker Documentation](https://docs.docker.com/)

2. **Collect Information**:
   ```bash
   # System info
   uname -a
   docker --version
   docker-compose --version
   
   # Container status
   docker-compose ps
   
   # Logs
   docker-compose logs > debug-logs.txt
   
   # Configuration
   cat docker-compose.yml
   cat .env
   ```

3. **Search/Report Issues**:
   - Search existing issues: https://github.com/Rjriva/UI-mediamtx/issues
   - Create a new issue with the information collected above

4. **Community Support**:
   - MediaMTX discussions: https://github.com/bluenviron/mediamtx/discussions
   - Docker forums: https://forums.docker.com/

## Quick Diagnostic Script

Run this script to collect diagnostic information:

```bash
#!/bin/bash
echo "=== UI-mediamtx Diagnostics ==="
echo ""
echo "=== System Info ==="
uname -a
echo ""
echo "=== Docker Version ==="
docker --version
docker-compose --version
echo ""
echo "=== Container Status ==="
docker-compose ps
echo ""
echo "=== Listening Ports ==="
sudo netstat -tuln | grep -E '3000|9997|8554|10000'
echo ""
echo "=== Firewall Status ==="
sudo ufw status
echo ""
echo "=== Recent Logs ==="
docker-compose logs --tail=50
echo ""
echo "=== Disk Space ==="
df -h
echo ""
echo "=== Docker Resources ==="
docker system df
```

Save as `diagnostics.sh`, make executable with `chmod +x diagnostics.sh`, and run with `./diagnostics.sh > diagnostics.txt`.
