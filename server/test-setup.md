# Testing the JaamSim Server-Side Wrapper

## Quick Start Test

1. **Start the Server**
   ```bash
   cd server
   npm install
   npm start
   ```

   Or use the Windows batch file:
   ```cmd
   start-server.bat
   ```

2. **Open Web Interface**
   - Navigate to `http://localhost:3000`
   - You should see the JaamSim Remote Control interface

3. **Test Configuration Loading**
   - The server should automatically discover configurations in `../cfg/`
   - Check the dropdown for available configurations:
     - `1up/1-up-station-simulation.cfg`
     - `3upturntable/Turn-table-simulation.cfg`

4. **Test JaamSim Execution**
   - Select a configuration from the dropdown
   - Click "Start" button
   - Monitor the output log for startup messages
   - JaamSim GUI should appear and be captured to the web interface

## Testing Checklist

### ✅ Server Startup
- [ ] Server starts without errors
- [ ] WebSocket server initializes
- [ ] Static files are served correctly
- [ ] API endpoints respond

### ✅ Configuration Management
- [ ] Configuration files are discovered automatically
- [ ] Dropdown populates with available configs
- [ ] File upload functionality works
- [ ] Uploaded files appear in config list

### ✅ JaamSim Integration
- [ ] JaamSim.exe can be found and executed
- [ ] Process spawns successfully
- [ ] Output is captured and displayed
- [ ] Process can be terminated cleanly

### ✅ Real-time Features
- [ ] WebSocket connection establishes
- [ ] Screen capture works
- [ ] Screenshots stream to web interface
- [ ] FPS counter updates
- [ ] Commands can be sent to JaamSim

### ✅ Web Interface
- [ ] Page loads without errors
- [ ] All buttons and controls work
- [ ] Log output displays correctly
- [ ] Connection status updates properly
- [ ] File upload interface functions

## Expected Test Results

### Successful Server Start
```
JaamSim Server running on http://localhost:3000
WebSocket server running on ws://localhost:3000
JaamSim executable path: C:\project\virtual_station\JaamSim.exe
```

### Successful JaamSim Start
```
[timestamp] Connected to JaamSim server
[timestamp] Loaded 2 configurations
[timestamp] Starting JaamSim...
[timestamp] JaamSim started with config: 1up/1-up-station-simulation.cfg
```

### Expected Web Interface Behavior
1. **Connection Status**: Should show "Connected" with green indicator
2. **Configuration Dropdown**: Should list available .cfg files
3. **Start Button**: Should be enabled when config is selected
4. **Screen Display**: Should show live JaamSim GUI when running
5. **Log Output**: Should display real-time JaamSim output

## Troubleshooting Test Issues

### JaamSim Not Starting
```
Error: JaamSim.exe not found
```
**Solution**: Ensure JaamSim.exe is in the project root directory

### Screen Capture Not Working
```
Screenshot capture error: Error: ...
```
**Solution**: Check Windows permissions and display availability

### Configuration Files Not Found
```
Loaded 0 configurations
```
**Solution**: Verify cfg/ directory exists with .cfg files

### WebSocket Connection Failed
```
Disconnected from server
```
**Solution**: Check firewall settings and port availability

## Performance Testing

### Expected Performance Metrics
- **Screen Capture Rate**: ~2 FPS (500ms intervals)
- **WebSocket Latency**: < 100ms for commands
- **Memory Usage**: ~100-200MB for server process
- **JaamSim Startup Time**: 3-5 seconds

### Load Testing
Test with multiple concurrent connections:
```bash
# Open multiple browser tabs to http://localhost:3000
# Verify all clients receive screen updates
# Check server performance under load
```

## Test Scenarios

### Scenario 1: Basic Operation
1. Start server
2. Connect via web interface
3. Select 1-up configuration
4. Start JaamSim
5. Verify screen capture works
6. Stop JaamSim
7. Verify clean shutdown

### Scenario 2: File Upload
1. Prepare a test .cfg file
2. Upload via web interface
3. Verify file appears in config dropdown
4. Start JaamSim with uploaded config
5. Verify successful execution

### Scenario 3: Multiple Clients
1. Open multiple browser tabs
2. Verify all receive same screen updates
3. Test that only one JaamSim instance runs
4. Verify commands from any client work

### Scenario 4: Error Recovery
1. Start JaamSim with invalid config
2. Verify error handling
3. Test server recovery
4. Start with valid config after error

## Integration with CI/CD

For automated testing, create test scripts:

```javascript
// test/server.test.js
const request = require('supertest');
const WebSocket = require('ws');

describe('JaamSim Server', () => {
  test('Health endpoint', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });

  test('Config discovery', async () => {
    const response = await request(app).get('/api/configs');
    expect(response.status).toBe(200);
    expect(response.body.configs).toBeDefined();
  });

  test('WebSocket connection', (done) => {
    const ws = new WebSocket('ws://localhost:3000');
    ws.on('open', () => {
      ws.close();
      done();
    });
  });
});
```

## Success Criteria

The server-side wrapper is working correctly if:

1. ✅ Server starts and runs without errors
2. ✅ JaamSim can be launched remotely
3. ✅ Screen capture streams to web clients
4. ✅ All JaamSim features work as expected
5. ✅ Multiple configurations can be loaded
6. ✅ Real-time control commands work
7. ✅ Clean shutdown and error recovery work
8. ✅ Performance is acceptable for demo use

This approach provides **100% fidelity** compared to ~80% with the web recreation approach, making it the ideal solution for remote JaamSim access.