# UI-mediamtx

A modern, feature-rich web-based control panel for managing MediaMTX SRT (Secure Reliable Transport) channels and connections.

## ✨ Features

### 🔐 User Authentication
- **Secure Login System**: Password-protected access to the control panel
- **SHA-256 Password Hashing**: Passwords are hashed using pure JavaScript implementation
- **Session Management**: Persistent sessions stored in localStorage
- **Default Credentials**: `admin` / `admin123` (configurable)
- **Logout Functionality**: Secure session termination
- **HTTP Compatible**: Works over HTTP and HTTPS - no SSL certificate required

### 🌐 Multi-Server Management
- **Multiple Server Support**: Manage multiple MediaMTX servers from one interface
- **Server CRUD Operations**: Add, edit, and delete server configurations
- **Quick Server Switching**: Seamlessly switch between configured servers
- **Server Credentials**: Store optional authentication credentials per server
- **Active Server Indicator**: Clear visual indication of the currently active server
- **Persistent Storage**: All server configurations saved in localStorage

### 🎬 Advanced SRT Channel Management
- **Create Channels**: Add new SRT paths with custom configurations
- **Edit Channels**: Modify existing channel settings inline
- **Delete Channels**: Remove channels with confirmation dialogs
- **Duplicate Channels**: Clone channel configurations quickly
- **View Channels**: Display all configured SRT channels with their settings
- **Real-time Updates**: Auto-refresh channel list after changes
- **Input Validation**: Robust validation for channel names and SRT URLs

### 📺 Live Stream Preview
- **HLS Video Preview**: Built-in HLS.js player for live stream visualization
- **Auto-Play**: Previews start automatically when stream is available
- **No Signal Detection**: Visual placeholder when stream is offline
- **Individual Toggle**: Show/hide preview for each channel independently
- **Global Toggle**: Enable/disable all previews at once
- **Persistent State**: Preview visibility settings saved per channel
- **Adaptive Quality**: Automatic quality adjustment based on connection

### 🔌 Enhanced Connection Management
- **Monitor Connections**: View active SRT connections in real-time
- **IN/OUT Separation**: Clear distinction between listener (IN) and caller (OUT) connections
- **Channel Grouping**: Connections grouped by their respective channels
- **Filter Options**: View all connections, only IN, or only OUT
- **Visual Indicators**: Color-coded badges for connection types
- **Disconnect Clients**: Kick/disconnect specific SRT connections
- **Auto-refresh**: Connections list updates every 5 seconds
- **Connection Details**: View remote address, state, and connection time

### ⚙️ Server Configuration
- **Flexible Setup**: Configure MediaMTX server URL and credentials
- **Connection Testing**: Test server connectivity before saving
- **Persistent Settings**: Server configuration stored in localStorage
- **Authentication Support**: Optional username/password authentication
- **CORS Handling**: Proper error messages for CORS issues

### ✨ Modern User Experience
- **Dark Theme**: Sleek dark UI with clean, modern design
- **Toast Notifications**: Success/error messages for all operations
- **Loading States**: Visual feedback during API calls
- **Smooth Animations**: Fade-in effects and hover transitions
- **Confirmation Dialogs**: Prevent accidental deletions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Keyboard Navigation**: Full keyboard accessibility
- **Icon Support**: Feather Icons for enhanced visual clarity

## 🚀 Quick Start

### Prerequisites
- MediaMTX server running with API enabled
- Modern web browser with ES6 module support
- HLS streaming enabled on MediaMTX (for video preview)

### Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/Rjriva/UI-mediamtx.git
   cd UI-mediamtx
   ```

2. **Serve the application**
   
   You can use any static web server. Here are a few options:

   **Python 3:**
   ```bash
   python -m http.server 8080
   ```

   **Node.js (http-server):**
   ```bash
   npx http-server -p 8080
   ```

   **PHP:**
   ```bash
   php -S localhost:8080
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

4. **Login**
   - Default username: `admin`
   - Default password: `admin123`

### MediaMTX Configuration

Ensure your MediaMTX server has the API and HLS enabled:

```yaml
# mediamtx.yml
api: yes
apiAddress: 0.0.0.0:9997

# Enable HLS for video preview
hls: yes
hlsAddress: :8888
hlsEncryption: no
hlsAllowOrigin: '*'

# Configure paths as needed
paths:
  all:
    # Your path configurations
```

If you're running the UI on a different domain than MediaMTX, you may need to configure CORS on your MediaMTX server or use a reverse proxy.

## 📖 Usage Guide

### 1. Login
1. Navigate to the application URL
2. Enter username and password (default: `admin` / `admin123`)
3. Click "Login"
4. Your session will be remembered until you logout

### 2. Manage Servers
1. Click "Add Server" in the Server Management section
2. Enter server name, URL (e.g., `http://localhost:9997`), and optional credentials
3. Click "Add Server"
4. Switch between servers using the dropdown selector
5. Edit or delete servers using the respective buttons

### 3. Create SRT Channel
1. Scroll to "Create New SRT Channel" section
2. Enter a unique channel name (alphanumeric, underscores, hyphens)
3. Enter the SRT source URL (e.g., `srt://0.0.0.0:10000?mode=listener`)
4. Optionally set publish user/password for authentication
5. Click "Create Channel"

### 4. Edit Channel
1. Find the channel in the list
2. Click the "Edit" button
3. Modify the channel settings
4. Click "Update Channel"
5. Or click "Cancel" to abort changes

### 5. View Live Preview
1. Channels with active streams will show live video preview
2. Click the eye icon (👁️) to hide preview
3. Click the crossed-eye icon (👁️‍🗨️) to show preview
4. Use "Toggle All Previews" button to control all previews at once
5. Preview states are remembered per channel

### 6. Monitor Connections
1. View active SRT connections in the "Active SRT Connections" section
2. Use filter buttons to view:
   - **All**: All connections
   - **IN (Listener)**: Only incoming connections
   - **OUT (Caller)**: Only outgoing connections
3. Connections are grouped by channel
4. Click "Disconnect" to terminate a connection
5. Auto-refreshes every 5 seconds

### 7. Delete Channel
1. Find the channel in the list
2. Click "Delete" button
3. Confirm the deletion in the dialog
4. Channel will be removed from MediaMTX

## 🔧 MediaMTX API Endpoints Used

This application uses the following MediaMTX Control API v3 endpoints:

- `GET /v3/config/paths/list` - List all paths
- `POST /v3/config/paths/add/{name}` - Create a new path
- `PATCH /v3/config/paths/patch/{name}` - Update a path
- `DELETE /v3/config/paths/delete/{name}` - Delete a path
- `GET /v3/config/paths/get/{name}` - Get path details
- `GET /v3/srtconns/list` - List SRT connections
- `POST /v3/srtconns/kick/{id}` - Disconnect an SRT connection

HLS streams are accessed at:
- `http://server:8888/{channelName}/index.m3u8`

## 📁 Project Structure

```
UI-mediamtx/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Application styles
├── js/
│   ├── auth.js             # Authentication service
│   ├── api.js              # MediaMTX API service
│   ├── utils.js            # Utility functions
│   ├── app.js              # Application entry point
│   └── components/
│       ├── Login.js              # Login component
│       ├── ServerManager.js      # Multi-server management
│       ├── ServerConfig.js       # Server configuration
│       ├── ChannelForm.js        # Channel creation/editing
│       ├── ChannelActions.js     # Channel management actions
│       ├── StreamViewer.js       # Channel viewer component
│       ├── StreamPreview.js      # HLS video preview
│       └── ConnectionManager.js  # SRT connection manager
└── README.md               # This file
```

## 🔒 Security Considerations

⚠️ **Important**: This application is designed for **personal and local network use**. 

### Security Features
- **Password Hashing**: Uses pure JavaScript SHA-256 implementation for password storage
- **Session Management**: Sessions stored in localStorage with unique tokens
- **Input Validation**: All inputs are validated and sanitized to prevent XSS
- **No Plaintext Passwords**: Passwords are never stored in plain text
- **HTTP/HTTPS Compatible**: Works over both HTTP and HTTPS - no SSL certificate required

### Network Security
- **Local Use**: Designed for use on private/local networks
- **CORS**: Ensure MediaMTX server allows requests from your UI domain
- **Internet Exposure**: If exposing to the internet, use proper network security measures:
  - VPN for remote access
  - Firewall rules to restrict access
  - Strong authentication credentials on MediaMTX
  - Consider using a reverse proxy with HTTPS
- **IP Access**: Application works over HTTP via IP addresses (e.g., `http://192.168.1.100:8080`)

### Recommendations
- Change default credentials immediately after first login
- Use strong passwords for MediaMTX server authentication
- Keep the application on a trusted network
- Use HTTPS if deploying in production environments

## 🌐 Browser Compatibility

- Chrome/Edge 61+
- Firefox 60+
- Safari 11+
- Any browser with ES6 module support and HLS.js compatibility

## 🛠️ Development

This is a vanilla JavaScript application with no build step required. Simply edit the files and refresh your browser.

### Code Structure
- **Modular Design**: Each component is a separate ES6 module
- **Event-Driven**: Components communicate via custom events
- **localStorage**: Persistent storage for configuration and preferences
- **Async/Await**: Modern async code with proper error handling
- **No Dependencies**: Pure vanilla JS except for HLS.js for video streaming

### Key Technologies
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **HLS.js**: For HTTP Live Streaming video playback
- **Pure JS SHA-256**: For password hashing (no crypto.subtle dependency)
- **Feather Icons**: For clean, consistent iconography
- **CSS3**: Modern CSS with animations and transitions

## 🐛 Troubleshooting

### Cannot connect to server
- Verify MediaMTX is running and API is enabled
- Check the server URL (should not end with `/`)
- Ensure CORS is configured correctly in MediaMTX
- Try testing the connection with the "Test Connection" button
- Check browser console for detailed error messages

### Channels not showing
- Refresh the page
- Check browser console for errors
- Verify API credentials if authentication is required
- Ensure you're connected to the correct server

### Video preview not working
- Verify HLS is enabled in MediaMTX configuration
- Check that stream is actively publishing
- Ensure HLS port (default 8888) is accessible
- Check browser console for HLS.js errors
- Try toggling the preview off and on

### CORS errors
- Configure MediaMTX to allow requests from your UI domain:
  ```yaml
  hlsAllowOrigin: '*'
  ```
- Or use a reverse proxy to serve both MediaMTX and the UI from the same origin
- Check that `apiAddress` and `hlsAddress` are properly configured

### Login issues
- Clear localStorage and reload the page
- Default credentials are `admin` / `admin123`
- Check browser console for authentication errors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

See LICENSE file for details.

## 🔗 Links

- [MediaMTX GitHub](https://github.com/bluenviron/mediamtx)
- [MediaMTX API Documentation](https://github.com/bluenviron/mediamtx#api)
- [SRT Protocol](https://www.srtalliance.org/)
- [HLS.js](https://github.com/video-dev/hls.js/)

## 📝 Changelog

### Version 2.0.0 (Latest)
- ✨ Added user authentication with password hashing
- ✨ Multi-server management support
- ✨ Channel editing functionality
- ✨ Live HLS video preview with toggle
- ✨ Enhanced connection monitor with IN/OUT separation
- ✨ Channel grouping for connections
- ✨ Improved UI with animations and transitions
- ✨ Better responsive design for mobile devices
- ✨ Global preview toggle
- 🐛 Various bug fixes and improvements

### Version 1.0.0
- Initial release
- Basic channel management
- Connection monitoring
- Server configuration
