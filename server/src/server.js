/**
 * JaamSim Server-Side Wrapper
 * Provides 100% fidelity to local JaamSim execution through web interface
 */

const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const screenshot = require('screenshot-desktop');

class JaamSimServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.jaamSimProcess = null;
        this.configPath = null;
        this.clients = new Set();
        this.screenshotInterval = null;
        this.jaamSimPath = path.join(__dirname, '../../JaamSim.exe');
        
        this.setupExpress();
        this.setupWebSocket();
        this.setupRoutes();
        this.setupFileUpload();
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Serve configuration files
        this.app.use('/configs', express.static(path.join(__dirname, '../../cfg')));
    }

    setupWebSocket() {
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });

        this.wss.on('connection', (ws) => {
            console.log('New client connected');
            this.clients.add(ws);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
                this.clients.delete(ws);
            });

            // Send initial status
            this.sendToClient(ws, {
                type: 'status',
                data: {
                    jaamSimRunning: this.jaamSimProcess !== null,
                    configLoaded: this.configPath !== null
                }
            });
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        // Get available configurations
        this.app.get('/api/configs', (req, res) => {
            try {
                const configDir = path.join(__dirname, '../../cfg');
                const configs = this.getAvailableConfigs(configDir);
                res.json({ configs });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Start JaamSim with configuration
        this.app.post('/api/start', (req, res) => {
            try {
                const { configFile } = req.body;
                this.startJaamSim(configFile);
                res.json({ message: 'JaamSim starting', configFile });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Stop JaamSim
        this.app.post('/api/stop', (req, res) => {
            try {
                this.stopJaamSim();
                res.json({ message: 'JaamSim stopped' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get JaamSim status
        this.app.get('/api/status', (req, res) => {
            res.json({
                jaamSimRunning: this.jaamSimProcess !== null,
                configLoaded: this.configPath !== null,
                pid: this.jaamSimProcess ? this.jaamSimProcess.pid : null
            });
        });

        // Send command to JaamSim (via stdin if supported)
        this.app.post('/api/command', (req, res) => {
            try {
                const { command } = req.body;
                this.sendCommandToJaamSim(command);
                res.json({ message: 'Command sent', command });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupFileUpload() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = path.join(__dirname, '../uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                cb(null, `${Date.now()}-${file.originalname}`);
            }
        });

        const upload = multer({ storage });

        this.app.post('/api/upload-config', upload.single('configFile'), (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                const uploadedPath = req.file.path;
                const targetPath = path.join(__dirname, '../../cfg/uploaded', req.file.originalname);
                
                // Ensure uploaded directory exists
                const uploadedDir = path.dirname(targetPath);
                if (!fs.existsSync(uploadedDir)) {
                    fs.mkdirSync(uploadedDir, { recursive: true });
                }

                // Move file to cfg directory
                fs.renameSync(uploadedPath, targetPath);

                res.json({ 
                    message: 'Configuration file uploaded successfully',
                    filename: req.file.originalname,
                    path: targetPath
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    getAvailableConfigs(dir) {
        const configs = [];
        
        function scanDirectory(dirPath, relativePath = '') {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                const relativeItemPath = path.join(relativePath, item);
                
                if (stat.isDirectory()) {
                    scanDirectory(fullPath, relativeItemPath);
                } else if (item.endsWith('.cfg')) {
                    configs.push({
                        name: item,
                        path: relativeItemPath,
                        fullPath: fullPath,
                        category: relativePath || 'root'
                    });
                }
            }
        }
        
        scanDirectory(dir);
        return configs;
    }

    startJaamSim(configFile) {
        if (this.jaamSimProcess) {
            throw new Error('JaamSim is already running');
        }

        const configPath = path.join(__dirname, '../../cfg', configFile);
        if (!fs.existsSync(configPath)) {
            throw new Error(`Configuration file not found: ${configFile}`);
        }

        console.log(`Starting JaamSim with config: ${configPath}`);
        
        // Start JaamSim process
        this.jaamSimProcess = spawn(this.jaamSimPath, [configPath], {
            cwd: path.dirname(this.jaamSimPath),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.configPath = configPath;

        // Handle process events
        this.jaamSimProcess.on('spawn', () => {
            console.log('JaamSim process spawned successfully');
            this.broadcastToClients({
                type: 'jaamSimStarted',
                data: { 
                    configFile,
                    pid: this.jaamSimProcess.pid 
                }
            });
            
            // Start screenshot capture after a delay to allow JaamSim to fully load
            setTimeout(() => {
                this.startScreenCapture();
            }, 3000);
        });

        this.jaamSimProcess.on('error', (error) => {
            console.error('JaamSim process error:', error);
            this.broadcastToClients({
                type: 'jaamSimError',
                data: { error: error.message }
            });
        });

        this.jaamSimProcess.on('exit', (code, signal) => {
            console.log(`JaamSim process exited with code ${code}, signal ${signal}`);
            this.jaamSimProcess = null;
            this.configPath = null;
            this.stopScreenCapture();
            
            this.broadcastToClients({
                type: 'jaamSimStopped',
                data: { code, signal }
            });
        });

        // Handle stdout/stderr
        this.jaamSimProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('JaamSim stdout:', output);
            this.broadcastToClients({
                type: 'jaamSimOutput',
                data: { output, type: 'stdout' }
            });
        });

        this.jaamSimProcess.stderr.on('data', (data) => {
            const output = data.toString();
            console.error('JaamSim stderr:', output);
            this.broadcastToClients({
                type: 'jaamSimOutput',
                data: { output, type: 'stderr' }
            });
        });
    }

    stopJaamSim() {
        if (this.jaamSimProcess) {
            console.log('Stopping JaamSim process');
            this.stopScreenCapture();
            this.jaamSimProcess.kill('SIGTERM');
            
            // Force kill after 5 seconds if process doesn't terminate
            setTimeout(() => {
                if (this.jaamSimProcess) {
                    console.log('Force killing JaamSim process');
                    this.jaamSimProcess.kill('SIGKILL');
                }
            }, 5000);
        }
    }

    sendCommandToJaamSim(command) {
        if (!this.jaamSimProcess) {
            throw new Error('JaamSim is not running');
        }

        // Send command to JaamSim stdin
        this.jaamSimProcess.stdin.write(command + '\n');
        console.log(`Sent command to JaamSim: ${command}`);
        
        this.broadcastToClients({
            type: 'commandSent',
            data: { command }
        });
    }

    startScreenCapture() {
        if (this.screenshotInterval) {
            clearInterval(this.screenshotInterval);
        }

        // Capture screenshots every 500ms for smooth real-time viewing
        this.screenshotInterval = setInterval(async () => {
            try {
                const img = await screenshot({ format: 'png' });
                const base64 = img.toString('base64');
                
                this.broadcastToClients({
                    type: 'screenshot',
                    data: { 
                        image: `data:image/png;base64,${base64}`,
                        timestamp: Date.now()
                    }
                });
            } catch (error) {
                console.error('Screenshot capture error:', error);
            }
        }, 500);

        console.log('Started screen capture');
    }

    stopScreenCapture() {
        if (this.screenshotInterval) {
            clearInterval(this.screenshotInterval);
            this.screenshotInterval = null;
            console.log('Stopped screen capture');
        }
    }

    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'requestScreenshot':
                // Send immediate screenshot
                this.captureAndSendScreenshot(ws);
                break;
                
            case 'sendCommand':
                try {
                    this.sendCommandToJaamSim(data.command);
                } catch (error) {
                    this.sendToClient(ws, {
                        type: 'error',
                        data: { message: error.message }
                    });
                }
                break;
                
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    async captureAndSendScreenshot(ws) {
        try {
            const img = await screenshot({ format: 'png' });
            const base64 = img.toString('base64');
            
            this.sendToClient(ws, {
                type: 'screenshot',
                data: { 
                    image: `data:image/png;base64,${base64}`,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('Screenshot capture error:', error);
            this.sendToClient(ws, {
                type: 'error',
                data: { message: 'Failed to capture screenshot' }
            });
        }
    }

    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`JaamSim Server running on http://localhost:${port}`);
            console.log(`WebSocket server running on ws://localhost:${port}`);
            console.log(`JaamSim executable path: ${this.jaamSimPath}`);
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('Shutting down server...');
            this.stopJaamSim();
            this.stopScreenCapture();
            this.server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
}

// Create and start the server
const jaamSimServer = new JaamSimServer();
jaamSimServer.start(process.env.PORT || 3000);

module.exports = JaamSimServer;