/**
 * 1-Up Station Simulation
 * Implements the single station manufacturing simulation logic
 */

class OneUpSimulation {
    constructor() {
        this.engine = new SimulationEngine();
        this.entities = {};
        this.metrics = {
            totalTime: 0,
            totalProcessed: 0,
            measurementUtilization: 0,
            downtimePercentage: 0,
            goodCount: 0,
            relitCount: 0,
            failedCount: 0
        };
        this.config = this.getDefaultConfig();
        this.animationEngine = null;
        this.dutTracker = new Map(); // Track DUTs for animation
        this.setupEventListeners();
        this.updateInterval = null;
    }

    getDefaultConfig() {
        return {
            totalDUTs: 100,
            goodPercent: 85,
            relitPercent: 10,
            loadTime: 10,
            measureTime: 9,
            ptbTime: 5,
            ptbRetry: 3,
            unloadTime: 5,
            beltTime: 1
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.resetSimulation();
    }

    setupEntities() {
        // Clear existing entities
        this.entities = {};
        this.engine.entities = [];

        // Calculate distribution
        const badPercent = 100 - this.config.goodPercent - this.config.relitPercent;
        const distribution = {
            good: this.config.goodPercent / 100,
            relit: this.config.relitPercent / 100,
            bad: badPercent / 100
        };

        // Create entities
        this.entities.generator = new Generator('generator', 'EntityGenerator1', {
            totalDUTs: this.config.totalDUTs,
            interArrivalTime: this.config.loadTime,
            distribution: distribution
        });

        this.entities.c1 = new Queue('c1', 'C1');
        this.entities.branch = new Branch('branch', 'Branch1');

        // Queues for different paths
        this.entities.queueMeasure = new Queue('queueMeasure', 'Queue_Measure');
        this.entities.queueRework = new Queue('queueRework', 'Queue_Rework');
        this.entities.queueFA = new Queue('queueFA', 'Queue_FA');

        // Servers/Stations
        this.entities.measurement = new Server('measurement', 'Measurement', {
            serviceTime: this.config.measureTime
        });

        this.entities.rework = new Server('rework', 'Rework', {
            serviceTime: this.config.loadTime
        });

        this.entities.fa = new Server('fa', 'FA', {
            serviceTime: this.config.ptbRetry * (this.config.ptbTime + this.config.loadTime)
        });

        // Sinks
        this.entities.unload = new Sink('unload', 'Unload');

        // Set up connections
        this.entities.generator.nextComponent = this.entities.c1;
        this.entities.c1.nextComponent = this.entities.branch;
        
        // Branch routing
        this.entities.branch.setNextComponent('good', this.entities.queueMeasure);
        this.entities.branch.setNextComponent('relit', this.entities.queueRework);
        this.entities.branch.setNextComponent('bad', this.entities.queueFA);

        // Queue connections
        this.entities.queueMeasure.nextComponent = this.entities.measurement;
        this.entities.queueRework.nextComponent = this.entities.rework;
        this.entities.queueFA.nextComponent = this.entities.fa;

        // Server wait queues
        this.entities.measurement.waitQueue = this.entities.queueMeasure;
        this.entities.rework.waitQueue = this.entities.queueRework;
        this.entities.fa.waitQueue = this.entities.queueFA;

        // Server next components
        this.entities.measurement.nextComponent = this.entities.unload;
        this.entities.rework.nextComponent = this.entities.queueMeasure; // Reworked DUTs go to measurement
        this.entities.fa.nextComponent = this.entities.unload;

        // Add all entities to simulation
        Object.values(this.entities).forEach(entity => {
            this.engine.addEntity(entity);
        });
    }

    setupEventListeners() {
        this.engine.on('update', (data) => {
            this.updateMetrics();
            this.updateUI();
        });

        this.engine.on('dutGenerated', (data) => {
            this.updateStationCount('generator', this.entities.generator.generatedCount);
            
            // Add DUT to animation
            if (this.animationEngine) {
                const animDUT = this.animationEngine.addDUT(data.dut);
                this.dutTracker.set(data.dut.id, {
                    dut: data.dut,
                    animDUT: animDUT,
                    currentStation: 'generator'
                });
                
                // Immediately move DUT to first conveyor
                setTimeout(() => {
                    this.animationEngine.moveDUT(data.dut.id, 'generator', 'branch');
                }, 100);
            }
        });

        this.engine.on('dutEnterQueue', (data) => {
            this.updateQueueCounts();
        });

        this.engine.on('dutLeaveQueue', (data) => {
            this.updateQueueCounts();
            
            // Animate DUT movement
            if (this.animationEngine && this.dutTracker.has(data.dut.id)) {
                const tracker = this.dutTracker.get(data.dut.id);
                const fromStation = this.getStationIdFromComponent(data.queue);
                const toStation = this.getStationIdFromComponent(data.queue.nextComponent);
                
                if (fromStation && toStation) {
                    this.animationEngine.moveDUT(data.dut.id, fromStation, toStation);
                    tracker.currentStation = toStation;
                }
            }
        });

        this.engine.on('dutStartProcessing', (data) => {
            this.updateStationVisuals(data.server.id, 'active');
            
            // Start processing animation
            if (this.animationEngine && this.dutTracker.has(data.dut.id)) {
                const stationId = this.getStationIdFromComponent(data.server);
                this.animationEngine.startProcessingDUT(data.dut.id, stationId);
            }
        });

        this.engine.on('dutFinishProcessing', (data) => {
            this.updateStationVisuals(data.server.id, 'idle');
            this.updateStationCount(data.server.id, data.server.numberProcessed);
            
            // Stop processing animation and move to next station
            if (this.animationEngine && this.dutTracker.has(data.dut.id)) {
                this.animationEngine.stopProcessingDUT(data.dut.id);
                
                const tracker = this.dutTracker.get(data.dut.id);
                const fromStation = data.server.id;
                const toStation = this.getStationIdFromComponent(data.server.nextComponent);
                
                if (toStation) {
                    this.animationEngine.moveDUT(data.dut.id, fromStation, toStation);
                    tracker.currentStation = toStation;
                }
            }
        });

        this.engine.on('dutRouted', (data) => {
            // Handle branch routing animation
            if (this.animationEngine && this.dutTracker.has(data.dut.id)) {
                const tracker = this.dutTracker.get(data.dut.id);
                const fromStation = 'branch';
                let toStation = '';
                
                if (data.dut.type === 'good') toStation = 'measure';
                else if (data.dut.type === 'relit') toStation = 'rework';
                else toStation = 'fa';
                
                this.animationEngine.moveDUT(data.dut.id, fromStation, toStation);
                tracker.currentStation = toStation;
            }
        });

        this.engine.on('dutComplete', (data) => {
            this.updateStationCount('unload', data.sink.numberProcessed);
            
            // Remove DUT from animation
            if (this.animationEngine && this.dutTracker.has(data.dut.id)) {
                this.animationEngine.removeDUT(data.dut.id);
                this.dutTracker.delete(data.dut.id);
            }
            
            // Update DUT type counts
            if (data.dut.type === 'good') this.metrics.goodCount++;
            else if (data.dut.type === 'relit') this.metrics.relitCount++;
            else this.metrics.failedCount++;
        });
    }

    updateMetrics() {
        this.metrics.totalTime = this.engine.currentTime;
        this.metrics.totalProcessed = this.entities.unload.numberProcessed;
        
        // Calculate measurement utilization
        if (this.engine.currentTime > 0) {
            this.metrics.measurementUtilization = this.entities.measurement.getUtilization();
        }

        // Calculate downtime percentage
        const totalWorkingTime = 
            this.entities.rework.workingTime + 
            this.entities.fa.workingTime;
        
        if (this.engine.currentTime > 0) {
            this.metrics.downtimePercentage = (totalWorkingTime / this.engine.currentTime) * 100;
        }
    }

    updateUI() {
        // Update time display
        document.getElementById('total-time-1up').textContent = `${this.metrics.totalTime.toFixed(1)} s`;
        
        // Update processed count
        document.getElementById('total-processed-1up').textContent = this.metrics.totalProcessed;
        
        // Update utilization
        document.getElementById('measure-util-1up').textContent = `${this.metrics.measurementUtilization.toFixed(1)}%`;
        
        // Update downtime
        document.getElementById('downtime-1up').textContent = `${this.metrics.downtimePercentage.toFixed(1)}%`;
        
        // Update DUT counts
        document.getElementById('good-count-1up').textContent = this.metrics.goodCount;
        document.getElementById('relit-count-1up').textContent = this.metrics.relitCount;
        document.getElementById('failed-count-1up').textContent = this.metrics.failedCount;
    }

    updateQueueCounts() {
        // Update station counts with queue lengths
        this.updateStationCount('measure', 
            this.entities.queueMeasure.getQueueLength() + this.entities.measurement.currentDUTs.length);
        this.updateStationCount('rework', 
            this.entities.queueRework.getQueueLength() + this.entities.rework.currentDUTs.length);
        this.updateStationCount('fa', 
            this.entities.queueFA.getQueueLength() + this.entities.fa.currentDUTs.length);
    }

    updateStationCount(stationId, count) {
        const element = document.querySelector(`#${stationId}-1up .station-count`);
        if (element) {
            element.textContent = count;
        }
        
        // Update animation engine station count
        if (this.animationEngine) {
            this.animationEngine.updateStationCount(stationId, count);
        }
    }

    updateStationVisuals(stationId, state) {
        const element = document.getElementById(`${stationId}-1up`);
        if (element) {
            element.classList.toggle('active', state === 'active');
        }
    }

    start() {
        this.setupEntities();
        
        // Initialize animation engine
        if (!this.animationEngine) {
            this.animationEngine = new AnimationEngine('animation-canvas-1up', '1up');
        }
        this.animationEngine.start();
        
        this.entities.generator.start();
        this.engine.start();
        
        // Force initial DUT generation for immediate visual feedback
        this.generateInitialDUTs();
    }

    generateInitialDUTs() {
        // Generate a few DUTs immediately to show animation
        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (this.entities.generator && this.entities.generator.generatedCount < this.config.totalDUTs) {
                        this.entities.generator.generateNextDUT();
                    }
                }, i * 2000); // Generate every 2 seconds
            }
        }, 500);
    }

    pause() {
        this.engine.pause();
        if (this.animationEngine) {
            this.animationEngine.pause();
        }
    }

    reset() {
        this.engine.reset();
        if (this.animationEngine) {
            this.animationEngine.reset();
        }
        this.dutTracker.clear();
        
        this.metrics = {
            totalTime: 0,
            totalProcessed: 0,
            measurementUtilization: 0,
            downtimePercentage: 0,
            goodCount: 0,
            relitCount: 0,
            failedCount: 0
        };
        this.updateUI();
        this.resetStationVisuals();
    }

    // Helper method to get station ID from component
    getStationIdFromComponent(component) {
        if (!component) return null;
        
        const componentMap = {
            'generator': 'generator',
            'branch': 'branch', 
            'measurement': 'measure',
            'rework': 'rework',
            'fa': 'fa',
            'unload': 'unload'
        };
        
        return componentMap[component.id] || component.id;
    }

    resetStationVisuals() {
        const stations = ['generator', 'branch', 'measure', 'rework', 'fa', 'unload'];
        stations.forEach(stationId => {
            const element = document.getElementById(`${stationId}-1up`);
            if (element) {
                element.classList.remove('active');
                const countElement = element.querySelector('.station-count');
                if (countElement) {
                    countElement.textContent = '0';
                }
            }
        });
    }

    setSpeed(multiplier) {
        this.engine.setSpeed(multiplier);
    }

    resetSimulation() {
        const wasRunning = this.engine.running;
        this.reset();
        if (wasRunning) {
            this.start();
        }
    }

    // Public methods for UI controls
    handleStart() {
        this.start();
    }

    handlePause() {
        this.pause();
    }

    handleReset() {
        this.reset();
    }

    handleSpeedChange(speed) {
        this.setSpeed(speed);
    }

    // Configuration update from UI
    updateFromUI() {
        const newConfig = {
            totalDUTs: parseInt(document.getElementById('total-dut-1up').value),
            goodPercent: parseFloat(document.getElementById('good-dut-1up').value),
            relitPercent: parseFloat(document.getElementById('relit-dut-1up').value),
            loadTime: parseFloat(document.getElementById('load-time-1up').value),
            measureTime: parseFloat(document.getElementById('measure-time-1up').value),
            ptbTime: parseFloat(document.getElementById('ptb-time-1up').value),
            ptbRetry: parseInt(document.getElementById('ptb-retry-1up').value),
            unloadTime: parseFloat(document.getElementById('unload-time-1up').value)
        };

        // Validate percentages sum to 100 or less
        const totalPercent = newConfig.goodPercent + newConfig.relitPercent;
        if (totalPercent > 100) {
            alert('Good DUT % and Re-lit DUT % cannot exceed 100% combined');
            return false;
        }

        this.updateConfig(newConfig);
        return true;
    }
}

// Global instance for the UI to access
let oneUpSimulation = null;