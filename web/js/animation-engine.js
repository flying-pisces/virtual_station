/**
 * Animation Engine for Virtual Station Simulations
 * Provides JaamSim-style visual animation with moving DUTs
 */

class AnimationEngine {
    constructor(canvasId, simulationType) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.simulationType = simulationType;
        
        // Animation state
        this.isAnimating = false;
        this.animationId = null;
        this.lastFrameTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        
        // View controls
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Animation objects
        this.stations = [];
        this.conveyors = [];
        this.duts = [];
        this.particles = [];
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initializeLayout();
    }

    setupCanvas() {
        // Set canvas size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = 600;
        this.canvas.height = 400;
        
        // High DPI support
        const ratio = window.devicePixelRatio || 1;
        if (ratio > 1) {
            this.canvas.width *= ratio;
            this.canvas.height *= ratio;
            this.canvas.style.width = '600px';
            this.canvas.style.height = '400px';
            this.ctx.scale(ratio, ratio);
        }
    }

    setupEventListeners() {
        // Mouse controls for pan and zoom
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.offsetX;
            this.lastMouseY = e.offsetY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.offsetX - this.lastMouseX;
                const deltaY = e.offsetY - this.lastMouseY;
                this.panX += deltaX;
                this.panY += deltaY;
                this.lastMouseX = e.offsetX;
                this.lastMouseY = e.offsetY;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom = Math.max(0.1, Math.min(3.0, this.zoom * zoomFactor));
        });

        // Zoom buttons
        const simType = this.simulationType;
        document.getElementById(`zoom-in-${simType}`)?.addEventListener('click', () => {
            this.zoom = Math.min(3.0, this.zoom * 1.2);
        });

        document.getElementById(`zoom-out-${simType}`)?.addEventListener('click', () => {
            this.zoom = Math.max(0.1, this.zoom * 0.8);
        });

        document.getElementById(`reset-view-${simType}`)?.addEventListener('click', () => {
            this.resetView();
        });
    }

    initializeLayout() {
        if (this.simulationType === '1up') {
            this.setup1UpLayout();
        } else if (this.simulationType === '3up') {
            this.setup3UpLayout();
        }
    }

    setup1UpLayout() {
        // Station positions for 1-up simulation
        this.stations = [
            { id: 'generator', x: 50, y: 200, width: 80, height: 60, label: 'Generator', color: '#3498db', count: 0 },
            { id: 'branch', x: 200, y: 200, width: 60, height: 60, label: 'PTB', color: '#9b59b6', count: 0 },
            { id: 'measure', x: 350, y: 120, width: 80, height: 60, label: 'Measurement', color: '#27ae60', count: 0 },
            { id: 'rework', x: 350, y: 200, width: 80, height: 60, label: 'Rework', color: '#f39c12', count: 0 },
            { id: 'fa', x: 350, y: 280, width: 80, height: 60, label: 'FA', color: '#e74c3c', count: 0 },
            { id: 'unload', x: 500, y: 200, width: 80, height: 60, label: 'Unload', color: '#34495e', count: 0 }
        ];

        // Conveyor paths
        this.conveyors = [
            { from: 'generator', to: 'branch', path: [{x: 130, y: 230}, {x: 200, y: 230}] },
            { from: 'branch', to: 'measure', path: [{x: 260, y: 230}, {x: 320, y: 230}, {x: 320, y: 150}, {x: 350, y: 150}] },
            { from: 'branch', to: 'rework', path: [{x: 260, y: 230}, {x: 350, y: 230}] },
            { from: 'branch', to: 'fa', path: [{x: 260, y: 230}, {x: 320, y: 230}, {x: 320, y: 310}, {x: 350, y: 310}] },
            { from: 'measure', to: 'unload', path: [{x: 430, y: 150}, {x: 470, y: 150}, {x: 470, y: 230}, {x: 500, y: 230}] },
            { from: 'rework', to: 'measure', path: [{x: 390, y: 260}, {x: 390, y: 180}] },
            { from: 'fa', to: 'unload', path: [{x: 430, y: 310}, {x: 470, y: 310}, {x: 470, y: 230}, {x: 500, y: 230}] }
        ];
    }

    setup3UpLayout() {
        // Station positions for 3-up turn table
        const centerX = 300;
        const centerY = 200;
        const radius = 100;

        this.stations = [
            { id: 'station1', x: centerX, y: centerY - radius, width: 100, height: 70, label: 'Station 1\nLoad', color: '#3498db', count: 0 },
            { id: 'station2', x: centerX + radius * 0.866, y: centerY + radius * 0.5, width: 100, height: 70, label: 'Station 2\nAOI', color: '#27ae60', count: 0 },
            { id: 'station3', x: centerX - radius * 0.866, y: centerY + radius * 0.5, width: 100, height: 70, label: 'Station 3\nLogging', color: '#e67e22', count: 0 },
            { id: 'container-queue', x: 450, y: 320, width: 80, height: 50, label: 'Containers', color: '#95a5a6', count: 3 }
        ];

        // Turn table center
        this.turnTableCenter = { x: centerX, y: centerY, radius: 15 };
        this.turnTableAngle = 0;

        // Conveyor paths for turn table
        this.conveyors = [
            { from: 'station1', to: 'station2', path: this.generateArcPath(centerX, centerY - radius, centerX + radius * 0.866, centerY + radius * 0.5, centerX, centerY) },
            { from: 'station2', to: 'station3', path: this.generateArcPath(centerX + radius * 0.866, centerY + radius * 0.5, centerX - radius * 0.866, centerY + radius * 0.5, centerX, centerY) },
            { from: 'station3', to: 'station1', path: this.generateArcPath(centerX - radius * 0.866, centerY + radius * 0.5, centerX, centerY - radius, centerX, centerY) }
        ];
    }

    generateArcPath(x1, y1, x2, y2, centerX, centerY) {
        // Generate arc path points for turn table movement
        const points = [];
        const numPoints = 20;
        const angle1 = Math.atan2(y1 - centerY, x1 - centerX);
        const angle2 = Math.atan2(y2 - centerY, x2 - centerX);
        let deltaAngle = angle2 - angle1;
        
        // Ensure we go the shorter way around
        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

        const radius = Math.sqrt((x1 - centerX) ** 2 + (y1 - centerY) ** 2);

        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const angle = angle1 + t * deltaAngle;
            points.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
        return points;
    }

    start() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.lastFrameTime = performance.now();
            this.animate();
            this.updateStatus('Running');
        }
    }

    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.updateStatus('Stopped');
    }

    pause() {
        this.isAnimating = false;
        this.updateStatus('Paused');
    }

    reset() {
        this.stop();
        this.duts = [];
        this.particles = [];
        this.resetView();
        this.updateStatus('Reset');
        this.render();
    }

    resetView() {
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
    }

    animate() {
        if (!this.isAnimating) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= this.frameInterval) {
            this.update(deltaTime / 1000); // Convert to seconds
            this.render();
            this.lastFrameTime = currentTime;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update(deltaTime) {
        // Update DUT positions
        this.duts.forEach(dut => {
            if (dut.isMoving && dut.path && dut.pathIndex < dut.path.length - 1) {
                dut.progress += dut.speed * deltaTime;
                
                if (dut.progress >= 1.0) {
                    dut.pathIndex++;
                    dut.progress = 0.0;
                    
                    if (dut.pathIndex >= dut.path.length - 1) {
                        dut.isMoving = false;
                        dut.x = dut.path[dut.path.length - 1].x;
                        dut.y = dut.path[dut.path.length - 1].y;
                    }
                }
                
                if (dut.isMoving && dut.pathIndex < dut.path.length - 1) {
                    const start = dut.path[dut.pathIndex];
                    const end = dut.path[dut.pathIndex + 1];
                    dut.x = start.x + (end.x - start.x) * dut.progress;
                    dut.y = start.y + (end.y - start.y) * dut.progress;
                }
            }
        });

        // Update turn table rotation for 3-up
        if (this.simulationType === '3up') {
            this.turnTableAngle += deltaTime * 0.5; // Slow rotation
        }

        // Update particles (sparks, effects)
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply transformations
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // Draw background grid
        this.drawGrid();

        // Draw conveyors
        this.drawConveyors();

        // Draw turn table center (for 3-up)
        if (this.simulationType === '3up') {
            this.drawTurnTable();
        }

        // Draw stations
        this.drawStations();

        // Draw DUTs
        this.drawDUTs();

        // Draw particles
        this.drawParticles();

        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        const startX = Math.floor(-this.panX / this.zoom / gridSize) * gridSize;
        const startY = Math.floor(-this.panY / this.zoom / gridSize) * gridSize;
        const endX = startX + (this.canvas.width / this.zoom) + gridSize;
        const endY = startY + (this.canvas.height / this.zoom) + gridSize;

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    drawConveyors() {
        this.ctx.strokeStyle = '#7f8c8d';
        this.ctx.lineWidth = 4;
        
        this.conveyors.forEach(conveyor => {
            if (conveyor.path && conveyor.path.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(conveyor.path[0].x, conveyor.path[0].y);
                
                for (let i = 1; i < conveyor.path.length; i++) {
                    this.ctx.lineTo(conveyor.path[i].x, conveyor.path[i].y);
                }
                
                this.ctx.stroke();
                
                // Draw direction arrows
                this.drawArrows(conveyor.path);
            }
        });
    }

    drawArrows(path) {
        if (path.length < 2) return;
        
        this.ctx.fillStyle = '#34495e';
        const arrowSize = 8;
        
        for (let i = 1; i < path.length; i++) {
            const start = path[i - 1];
            const end = path[i];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 20) {
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const angle = Math.atan2(dy, dx);
                
                this.ctx.save();
                this.ctx.translate(midX, midY);
                this.ctx.rotate(angle);
                
                this.ctx.beginPath();
                this.ctx.moveTo(-arrowSize, -arrowSize/2);
                this.ctx.lineTo(0, 0);
                this.ctx.lineTo(-arrowSize, arrowSize/2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
        }
    }

    drawTurnTable() {
        const center = this.turnTableCenter;
        
        // Draw turn table base
        this.ctx.fillStyle = '#34495e';
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, center.radius + 10, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw rotating element
        this.ctx.save();
        this.ctx.translate(center.x, center.y);
        this.ctx.rotate(this.turnTableAngle);
        
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-center.radius, 0);
        this.ctx.lineTo(center.radius, 0);
        this.ctx.moveTo(0, -center.radius);
        this.ctx.lineTo(0, center.radius);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    drawStations() {
        this.stations.forEach(station => {
            // Draw station body
            this.ctx.fillStyle = station.color;
            this.ctx.fillRect(station.x - station.width/2, station.y - station.height/2, station.width, station.height);
            
            // Draw station border
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(station.x - station.width/2, station.y - station.height/2, station.width, station.height);
            
            // Draw station label
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const lines = station.label.split('\n');
            lines.forEach((line, index) => {
                this.ctx.fillText(line, station.x, station.y + (index - (lines.length - 1) / 2) * 14);
            });
            
            // Draw count badge
            if (station.count > 0) {
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.beginPath();
                this.ctx.arc(station.x + station.width/2 - 10, station.y - station.height/2 + 10, 12, 0, 2 * Math.PI);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.fillText(station.count.toString(), station.x + station.width/2 - 10, station.y - station.height/2 + 10);
            }
        });
    }

    drawDUTs() {
        this.duts.forEach(dut => {
            // Draw DUT body
            const size = 12;
            this.ctx.fillStyle = dut.color;
            this.ctx.beginPath();
            this.ctx.arc(dut.x, dut.y, size, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw DUT border
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw DUT ID
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(dut.id.slice(-2), dut.x, dut.y);
            
            // Draw trail if moving
            if (dut.isMoving && dut.trail && dut.trail.length > 1) {
                this.ctx.strokeStyle = dut.color + '60'; // Semi-transparent
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(dut.trail[0].x, dut.trail[0].y);
                for (let i = 1; i < dut.trail.length; i++) {
                    this.ctx.lineTo(dut.trail[i].x, dut.trail[i].y);
                }
                this.ctx.stroke();
            }
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }

    // Public methods for simulation integration
    addDUT(dutData) {
        const color = dutData.type === 'good' ? '#27ae60' : 
                     dutData.type === 'relit' ? '#f39c12' : '#e74c3c';
        
        const startStation = this.stations.find(s => s.id === 'generator') || 
                           this.stations.find(s => s.id === 'station1') ||
                           this.stations[0];
        
        const dut = {
            id: dutData.id,
            type: dutData.type,
            x: startStation.x,
            y: startStation.y,
            color: color,
            isMoving: false,
            path: null,
            pathIndex: 0,
            progress: 0,
            speed: 50, // pixels per second
            trail: []
        };
        
        this.duts.push(dut);
        return dut;
    }

    moveDUT(dutId, fromStation, toStation) {
        const dut = this.duts.find(d => d.id === dutId);
        if (!dut) return;
        
        const conveyor = this.conveyors.find(c => c.from === fromStation && c.to === toStation);
        if (conveyor && conveyor.path) {
            dut.path = conveyor.path;
            dut.pathIndex = 0;
            dut.progress = 0;
            dut.isMoving = true;
            dut.trail = [];
            
            // Add particle effect at start
            this.addParticleEffect(dut.x, dut.y, dut.color);
        }
    }

    removeDUT(dutId) {
        const index = this.duts.findIndex(d => d.id === dutId);
        if (index !== -1) {
            const dut = this.duts[index];
            this.addParticleEffect(dut.x, dut.y, '#ffffff');
            this.duts.splice(index, 1);
        }
    }

    updateStationCount(stationId, count) {
        const station = this.stations.find(s => s.id === stationId);
        if (station) {
            station.count = count;
        }
    }

    addParticleEffect(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                color: color,
                size: Math.random() * 4 + 2,
                life: Math.random() * 2 + 1,
                maxLife: Math.random() * 2 + 1,
                alpha: 1.0
            });
        }
    }

    updateStatus(status) {
        const statusElement = document.getElementById(`animation-status-${this.simulationType}`);
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationEngine;
}