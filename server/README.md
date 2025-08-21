# JaamSim Server-Side Wrapper

This server provides 100% fidelity remote access to JaamSim by running the actual JaamSim.exe on the server and streaming the GUI to web clients. This approach ensures complete compatibility with all JaamSim features and provides the exact same user experience as running JaamSim locally.

## Architecture

- **Node.js Server**: Manages JaamSim process execution, file uploads, and WebSocket connections
- **WebSocket Communication**: Real-time bidirectional communication between server and clients
- **Screen Capture**: Captures and streams JaamSim GUI in real-time
- **Remote Control**: Send commands and control JaamSim remotely through web interface

## Features

### 🎯 100% Fidelity
- Runs actual JaamSim.exe on server
- No recreation or emulation - authentic JaamSim experience
- All JaamSim features and animations work exactly as designed

### 🖥️ Real-time Screen Streaming
- Live screen capture at ~2 FPS for smooth visualization
- Automatic screenshot optimization
- FPS counter and timestamp display

### 🎮 Remote Control
- Upload and select configuration files
- Start/stop JaamSim processes
- Send commands to JaamSim
- Real-time output log monitoring

### 🔗 Web Interface
- Clean, modern dark theme interface
- Responsive design for desktop and mobile
- Connection status monitoring
- File upload capability

## Installation

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Verify JaamSim Path**
   - Ensure `JaamSim.exe` is in the project root directory
   - Server will look for `../../JaamSim.exe` relative to the server source

3. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Usage

### Starting the Server

```bash
cd server
npm start
```

The server will start on port 3000 by default. Access the web interface at:
```
http://localhost:3000
```

### Web Interface Components

#### 1. Configuration Management
- **Select Configuration**: Choose from available .cfg files in the cfg/ directory
- **Upload Configuration**: Upload new .cfg files to the server
- **Auto-discovery**: Server automatically scans cfg/ directory for configurations

#### 2. JaamSim Control
- **Start**: Launch JaamSim with selected configuration
- **Stop**: Terminate running JaamSim process
- **Capture Screenshot**: Manual screenshot capture

#### 3. Command Interface
- **Command Input**: Send direct commands to JaamSim
- **Output Log**: Real-time monitoring of JaamSim stdout/stderr
- **Clear Log**: Clear the output log

#### 4. Live Screen Display
- **Real-time View**: Live streaming of JaamSim GUI
- **FPS Counter**: Shows current frames per second
- **Timestamp**: Last update timestamp
- **Auto-scaling**: Screen automatically scales to fit container

### API Endpoints

#### Configuration Management
- `GET /api/configs` - List available configurations
- `POST /api/upload-config` - Upload new configuration file

#### JaamSim Control
- `POST /api/start` - Start JaamSim with configuration
- `POST /api/stop` - Stop running JaamSim
- `GET /api/status` - Get current JaamSim status
- `POST /api/command` - Send command to JaamSim

#### System
- `GET /api/health` - Server health check

### WebSocket Messages

#### Client to Server
```json
{
  "type": "requestScreenshot"
}
```

```json
{
  "type": "sendCommand",
  "command": "pause"
}
```

#### Server to Client
```json
{
  "type": "screenshot",
  "data": {
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "timestamp": 1640995200000
  }
}
```

```json
{
  "type": "jaamSimStarted",
  "data": {
    "configFile": "1up/1-up-station-simulation.cfg",
    "pid": 12345
  }
}
```

## Configuration Files

The server automatically discovers configuration files in the `cfg/` directory structure:

```
cfg/
├── 1up/
│   └── 1-up-station-simulation.cfg
├── 3upturntable/
│   └── Turn-table-simulation.cfg
└── uploaded/
    └── (user uploaded files)
```

## Security Considerations

⚠️ **Important**: This server is designed for development and controlled environments. For production use, consider:

- Authentication and authorization
- Rate limiting for API endpoints
- Secure file upload validation
- Network access restrictions
- Process isolation and sandboxing

## Troubleshooting

### JaamSim Won't Start
1. Verify `JaamSim.exe` exists in project root
2. Check configuration file path and validity
3. Ensure JaamSim has proper Windows permissions
4. Check server logs for specific error messages

### Screen Capture Issues
1. Verify `screenshot-desktop` package installation
2. Check Windows permissions for screen capture
3. Ensure display is available (not headless server)

### WebSocket Connection Problems
1. Check firewall settings
2. Verify port 3000 is available
3. Check browser WebSocket support
4. Review network proxy settings

### Performance Issues
1. Adjust screenshot capture interval in server.js
2. Monitor server CPU and memory usage
3. Check network bandwidth for streaming
4. Consider reducing screen capture quality

## Development

### File Structure
```
server/
├── src/
│   └── server.js          # Main server application
├── public/
│   └── index.html         # Web client interface
├── config/                # Server configuration files
├── uploads/               # Temporary upload directory
└── package.json           # Node.js dependencies
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### Extending Functionality
- Add authentication middleware
- Implement session management
- Add configuration validation
- Enhance error handling
- Add metrics and monitoring

## Comparison: Server-Side vs Web Recreation

| Feature | Server-Side Wrapper | Web Recreation |
|---------|-------------------|----------------|
| **Fidelity** | 100% - Actual JaamSim | ~80% - Recreation |
| **Features** | All JaamSim features | Limited subset |
| **Animations** | Authentic JaamSim | Custom animations |
| **Setup** | Simple server setup | Complex development |
| **Performance** | Screen streaming overhead | Native web performance |
| **Compatibility** | Perfect | May have gaps |

## Benefits of Server-Side Approach

1. **Perfect Compatibility**: Uses actual JaamSim executable
2. **No Feature Gaps**: All JaamSim functionality available
3. **Rapid Deployment**: No need to recreate complex simulations
4. **Authentic Experience**: Users see exactly what they expect
5. **Future-Proof**: Automatically supports new JaamSim versions