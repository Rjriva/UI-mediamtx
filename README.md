# UI-mediamtx

A modern web-based control panel for managing MediaMTX SRT (Secure Reliable Transport) channels and connections.

## Features

### 🎬 SRT Channel Management
- **Create Channels**: Add new SRT paths with custom configurations
- **Delete Channels**: Remove channels with confirmation dialogs
- **View Channels**: Display all configured SRT channels with their settings
- **Real-time Updates**: Auto-refresh channel list

### 🔌 Connection Management
- **Monitor Connections**: View active SRT connections in real-time
- **Disconnect Clients**: Kick/disconnect specific SRT connections
- **Auto-refresh**: Connections list updates every 5 seconds

### ⚙️ Server Configuration
- **Flexible Setup**: Configure MediaMTX server URL and credentials
- **Connection Testing**: Test server connectivity before saving
- **Persistent Settings**: Server configuration stored in localStorage
- **Authentication Support**: Optional username/password authentication

### ✨ User Experience
- **Dark Theme**: Modern dark UI with clean design
- **Toast Notifications**: Success/error messages for all operations
- **Loading States**: Visual feedback during API calls
- **Validation**: Input validation for channel names and SRT URLs
- **Confirmation Dialogs**: Prevent accidental deletions
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites
- MediaMTX server running with API enabled
- Modern web browser with ES6 module support

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

### MediaMTX Configuration

Ensure your MediaMTX server has the API enabled and CORS configured:

```yaml
# mediamtx.yml
api: yes
apiAddress: 0.0.0.0:9997

# Enable CORS for the web UI
paths:
  all:
    # Your path configurations
```

If you're running the UI on a different domain than MediaMTX, you may need to configure CORS on your MediaMTX server or use a reverse proxy.

## Usage

### 1. Configure Server Connection

1. Enter your MediaMTX server URL (e.g., `http://localhost:9997`)
2. Optionally add authentication credentials
3. Click "Save & Connect" or "Test Connection"

### 2. Create SRT Channel

1. Enter a unique channel name (alphanumeric, underscores, hyphens)
2. Enter the SRT source URL (e.g., `srt://0.0.0.0:10000?mode=listener`)
3. Optionally set publish user/password for authentication
4. Click "Create Channel"

### 3. Manage Channels

- View all channels in the grid below
- Click "Delete Channel" to remove a channel (with confirmation)
- Click "Refresh" to reload the channel list

### 4. Monitor Connections

- View active SRT connections in real-time
- Click "Disconnect" to kick a connection
- Connections auto-refresh every 5 seconds

## MediaMTX API Endpoints Used

This application uses the following MediaMTX Control API v3 endpoints:

- `GET /v3/config/paths/list` - List all paths
- `POST /v3/config/paths/add/{name}` - Create a new path
- `DELETE /v3/config/paths/delete/{name}` - Delete a path
- `GET /v3/config/paths/get/{name}` - Get path details
- `GET /v3/srtconns/list` - List SRT connections
- `POST /v3/srtconns/kick/{id}` - Disconnect an SRT connection

## Project Structure

```
UI-mediamtx/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Application styles
├── js/
│   ├── api.js              # MediaMTX API service
│   ├── utils.js            # Utility functions
│   ├── app.js              # Application entry point
│   └── components/
│       ├── ServerConfig.js      # Server configuration component
│       ├── ChannelForm.js       # Channel creation form
│       ├── ChannelActions.js    # Channel management actions
│       ├── ConnectionManager.js # SRT connection manager
│       └── StreamViewer.js      # Channel viewer component
└── README.md               # This file
```

## Browser Compatibility

- Chrome/Edge 61+
- Firefox 60+
- Safari 11+
- Any browser with ES6 module support

## Security Considerations

- **CORS**: Ensure MediaMTX server allows requests from your UI domain
- **HTTPS**: Use HTTPS in production for secure authentication
- **Authentication**: Always use authentication credentials when exposing MediaMTX to the internet
- **Input Validation**: All inputs are validated to prevent invalid configurations
- **XSS Protection**: All user inputs are escaped before rendering

## Troubleshooting

### Cannot connect to server
- Verify MediaMTX is running and API is enabled
- Check the server URL (should not end with `/`)
- Ensure CORS is configured correctly
- Try testing the connection with the "Test Connection" button

### Channels not showing
- Refresh the page
- Check browser console for errors
- Verify API credentials if authentication is required

### CORS errors
- Configure MediaMTX to allow requests from your UI domain
- Or use a reverse proxy to serve both MediaMTX and the UI from the same origin

## Development

This is a vanilla JavaScript application with no build step required. Simply edit the files and refresh your browser.

### Code Structure
- **Modular Design**: Each component is a separate ES6 module
- **Event-Driven**: Components communicate via custom events
- **localStorage**: Server configuration persists across sessions
- **Async/Await**: Modern async code with proper error handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

See LICENSE file for details.

## Links

- [MediaMTX GitHub](https://github.com/bluenviron/mediamtx)
- [MediaMTX API Documentation](https://github.com/bluenviron/mediamtx#api)
- [SRT Protocol](https://www.srtalliance.org/)
