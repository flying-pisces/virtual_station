/**
 * 3-Up Turn Table Simulation
 * Implements the 3-station turn table manufacturing simulation logic
 */

// Container class for turn table simulation
class Container extends Entity {
    constructor(id, name) {
        super(id, name);
        this.containedDUTs = [];
        this.maxCapacity = 1;
    }

    addDUT(dut) {
        if (this.containedDUTs.length < this.maxCapacity) {
            this.containedDUTs.push(dut);
            return true;
        }
        return false;
    }

    removeDUT() {
        return this.containedDUTs.shift() || null;
    }

    isEmpty() {
        return this.containedDUTs.length === 0;
    }

    reset() {
        super.reset();
        this.containedDUTs = [];
    }
}

// Enhanced Server for turn table operations
class TurnTableServer extends Server {
    constructor(id, name, config) {
        super(id, name, config);
        this.containerQueue = null;
        this.nextForContainers = null;
    }

    receiveDUT(dut) {
        if (this.config.requiresContainer && this.containerQueue) {
            // For operations that require containers (AddTo/RemoveFrom)
            this.processWithContainer(dut);
        } else {
            // Regular processing
            super.receiveDUT(dut);
        }
    }

    processWithContainer(dut) {
        if (this.containerQueue && !this.containerQueue.isEmpty() && this.isAvailable()) {
            this.startProcessing(dut);
        } else if (this.waitQueue) {
            this.waitQueue.receiveDUT(dut);
        }
    }

    finishProcessing(dut) {
        super.finishProcessing(dut);
        
        // Handle container operations
        if (this.config.requiresContainer && this.containerQueue && this.nextForContainers) {
            // Return container to circulation
            if (!this.containerQueue.isEmpty()) {
                const container = this.containerQueue.duts.shift(); // Get a container
                if (this.nextForContainers) {
                    this.nextForContainers.receiveDUT(container);
                }
            }
        }
    }
}

class ThreeUpSimulation {
    constructor() {
        this.engine = new SimulationEngine();
        this.entities = {};
        this.metrics = {
            totalTime: 0,
            completedLoad: 0,
            completedAOI: 0,
            completedLogging: 0,
            completedUnload: 0,
            totalCompleted: 0,
            measurementUtilization: 0,
            downtimePercentage: 0
        };
        this.config = this.getDefaultConfig();
        this.setupEventListeners();
    }

    getDefaultConfig() {
        return {
            totalDUTs: 5000,
            goodPercent: 95,
            relitPercent: 3,
            opLoadTime: 13,
            measureTime: 9,
            logTime: 8,
            ptbTime: 1,
            ptbRetry: 3,
            beltTime: 3,
            opUnloadTime: 2
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

        // Create DUT generator
        this.entities.generator = new Generator('generator', 'EntityGenerator1', {
            totalDUTs: this.config.totalDUTs,
            interArrivalTime: this.config.opLoadTime / 10, // Generate faster than processing
            distribution: distribution
        });

        // Create container generator (3 containers)
        this.entities.containerGenerator = new Generator('containerGenerator', 'EntityGenerator_container', {
            totalDUTs: 3,
            interArrivalTime: 1,
            distribution: { good: 1.0, relit: 0, bad: 0 } // All containers are "good"
        });

        // Branch for DUT routing
        this.entities.branch = new Branch('branch', 'Branch1');

        // Queues for different DUT types
        this.entities.queue1 = new Queue('queue1', 'Queue1'); // Good DUTs
        this.entities.queue2 = new Queue('queue2', 'Queue2'); // Bad DUTs  
        this.entities.queue3 = new Queue('queue3', 'Queue3'); // Re-lit DUTs

        // Container circulation queues
        this.entities.containerQueue = new Queue('containerQueue', 'ContainerQueue');
        this.entities.q1 = new Queue('q1', 'q1'); // Container waiting
        this.entities.q2 = new Queue('q2', 'q2', { maxLength: 10 }); // Container after processing

        // Servers for PTB operations
        this.entities.relitServer = new Server('relitServer', 'Relit_server', {
            serviceTime: this.config.ptbRetry * (this.config.ptbTime + this.config.opLoadTime)
        });

        this.entities.nolitServer = new Server('nolitServer', 'NoLit_server', {
            serviceTime: this.config.ptbRetry * (this.config.ptbTime + this.config.opLoadTime)
        });

        // Turn table stations
        this.entities.addTo1 = new TurnTableServer('addTo1', 'AddTo1', {
            serviceTime: this.config.opLoadTime,
            requiresContainer: true
        });

        this.entities.station2 = new Server('station2', 'EntityDelay_Station2', {
            serviceTime: this.config.measureTime
        });

        this.entities.station3 = new Server('station3', 'EntityDelay_Station3', {
            serviceTime: this.config.logTime
        });

        this.entities.removeFrom1 = new TurnTableServer('removeFrom1', 'RemoveFrom1', {
            serviceTime: this.config.opUnloadTime,
            requiresContainer: true
        });

        // Conveyor segments
        this.entities.c1 = new Queue('c1', 'c1');
        this.entities.c12 = new Queue('c12', 'c12');
        this.entities.c23 = new Queue('c23', 'c23');
        this.entities.c31 = new Queue('c31', 'c31');
        this.entities.cQuit = new Queue('cQuit', 'c_quit');
        this.entities.cUnload = new Queue('cUnload', 'c_unload');

        // Final sink
        this.entities.sink = new Sink('sink', 'EntitySink1');

        // Set up connections - DUT flow
        this.entities.generator.nextComponent = this.entities.branch;
        
        // Branch routing
        this.entities.branch.setNextComponent('good', this.entities.queue1);
        this.entities.branch.setNextComponent('relit', this.entities.queue3);
        this.entities.branch.setNextComponent('bad', this.entities.queue2);

        // Queue to server connections
        this.entities.queue1.nextComponent = this.entities.addTo1;
        this.entities.queue2.nextComponent = this.entities.nolitServer;
        this.entities.queue3.nextComponent = this.entities.relitServer;

        // Server wait queues
        this.entities.addTo1.waitQueue = this.entities.queue1;
        this.entities.nolitServer.waitQueue = this.entities.queue2;
        this.entities.relitServer.waitQueue = this.entities.queue3;

        // Server next components
        this.entities.relitServer.nextComponent = this.entities.queue1; // Relit DUTs go back to loading
        this.entities.nolitServer.nextComponent = this.entities.cQuit;
        this.entities.addTo1.nextComponent = this.entities.c12;

        // Turn table flow
        this.entities.c12.nextComponent = this.entities.station2;
        this.entities.station2.nextComponent = this.entities.c23;
        this.entities.c23.nextComponent = this.entities.station3;
        this.entities.station3.nextComponent = this.entities.c31;
        this.entities.c31.nextComponent = this.entities.q2;
        
        this.entities.q2.nextComponent = this.entities.removeFrom1;
        this.entities.removeFrom1.waitQueue = this.entities.q2;
        this.entities.removeFrom1.nextComponent = this.entities.cUnload;
        
        this.entities.cQuit.nextComponent = this.entities.sink;
        this.entities.cUnload.nextComponent = this.entities.sink;

        // Container circulation
        this.entities.containerGenerator.nextComponent = this.entities.c1;
        this.entities.c1.nextComponent = this.entities.addTo1;
        
        // Set up container queues
        this.entities.addTo1.containerQueue = this.entities.containerQueue;
        this.entities.addTo1.nextForContainers = this.entities.c1; // Containers return here
        this.entities.removeFrom1.containerQueue = this.entities.containerQueue;
        this.entities.removeFrom1.nextForContainers = this.entities.c1;

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

        this.engine.on('dutFinishProcessing', (data) => {
            // Update completion metrics based on which server finished
            switch(data.server.id) {
                case 'addTo1':
                    this.metrics.completedLoad = data.server.numberProcessed;
                    break;
                case 'station2':
                    this.metrics.completedAOI = data.server.numberProcessed;
                    break;
                case 'station3':
                    this.metrics.completedLogging = data.server.numberProcessed;
                    break;
                case 'removeFrom1':
                    this.metrics.completedUnload = data.server.numberProcessed;
                    break;
            }
            
            this.updateStationCount(data.server.id, data.server.numberProcessed);
            this.updateStationVisuals(data.server.id, 'idle');
        });

        this.engine.on('dutStartProcessing', (data) => {
            this.updateStationVisuals(data.server.id, 'active');
        });

        this.engine.on('dutComplete', (data) => {
            this.metrics.completedUnload = data.sink.numberProcessed;
        });

        this.engine.on('dutEnterQueue', (data) => {
            this.updateQueueCounts();
        });

        this.engine.on('dutLeaveQueue', (data) => {
            this.updateQueueCounts();
        });
    }

    updateMetrics() {
        this.metrics.totalTime = this.engine.currentTime;
        this.metrics.totalCompleted = 
            this.entities.nolitServer.numberProcessed + 
            this.entities.removeFrom1.numberProcessed;
        
        // Calculate measurement utilization (Station 2)
        if (this.engine.currentTime > 0) {
            this.metrics.measurementUtilization = this.entities.station2.getUtilization();
        }

        // Calculate downtime percentage
        const downtimeWorkingTime = 
            this.entities.cQuit.workingTime + 
            this.entities.relitServer.workingTime + 
            this.entities.nolitServer.workingTime;
        
        if (this.engine.currentTime > 0) {
            this.metrics.downtimePercentage = (downtimeWorkingTime / this.engine.currentTime) * 100;
        }
    }

    updateUI() {
        // Update time display
        document.getElementById('total-time-3up').textContent = `${this.metrics.totalTime.toFixed(1)} s`;
        
        // Update completion metrics
        document.getElementById('completed-load-3up').textContent = this.metrics.completedLoad;
        document.getElementById('completed-aoi-3up').textContent = this.metrics.completedAOI;
        document.getElementById('completed-log-3up').textContent = this.metrics.completedLogging;
        document.getElementById('completed-unload-3up').textContent = this.metrics.completedUnload;
        document.getElementById('total-completed-3up').textContent = this.metrics.totalCompleted;
        
        // Update utilization and downtime
        document.getElementById('measure-util-3up').textContent = `${this.metrics.measurementUtilization.toFixed(1)}%`;
        document.getElementById('downtime-3up').textContent = `${this.metrics.downtimePercentage.toFixed(1)}%`;
    }

    updateQueueCounts() {
        // Update station counts with current processing + queue
        this.updateStationCount('station1', 
            this.entities.queue1.getQueueLength() + this.entities.addTo1.currentDUTs.length);
        this.updateStationCount('station2', 
            this.entities.c12.getQueueLength() + this.entities.station2.currentDUTs.length);
        this.updateStationCount('station3', 
            this.entities.c23.getQueueLength() + this.entities.station3.currentDUTs.length);
    }

    updateStationCount(stationId, count) {
        const element = document.querySelector(`#${stationId}-3up .station-count`);
        if (element) {
            element.textContent = count;
        }
    }

    updateStationVisuals(stationId, state) {
        const element = document.getElementById(`${stationId}-3up`);
        if (element) {
            element.classList.toggle('active', state === 'active');
        }
    }

    start() {
        this.setupEntities();
        // Start both generators
        this.entities.generator.start();
        this.entities.containerGenerator.start();
        this.engine.start();
    }

    pause() {
        this.engine.pause();
    }

    reset() {
        this.engine.reset();
        this.metrics = {
            totalTime: 0,
            completedLoad: 0,
            completedAOI: 0,
            completedLogging: 0,
            completedUnload: 0,
            totalCompleted: 0,
            measurementUtilization: 0,
            downtimePercentage: 0
        };
        this.updateUI();
        this.resetStationVisuals();
    }

    resetStationVisuals() {
        const stations = ['station1', 'station2', 'station3'];
        stations.forEach(stationId => {
            const element = document.getElementById(`${stationId}-3up`);
            if (element) {
                element.classList.remove('active');
                const countElement = element.querySelector('.station-count');
                if (countElement) {
                    countElement.textContent = '0';
                }
            }
        });
        
        // Reset container queue count
        const containerElement = document.getElementById('container-queue-3up');
        if (containerElement) {
            const countElement = containerElement.querySelector('.queue-count');
            if (countElement) {
                countElement.textContent = '3';
            }
        }
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
            totalDUTs: parseInt(document.getElementById('total-dut-3up').value),
            goodPercent: parseFloat(document.getElementById('good-dut-3up').value),
            relitPercent: parseFloat(document.getElementById('relit-dut-3up').value),
            opLoadTime: parseFloat(document.getElementById('op-load-time-3up').value),
            measureTime: parseFloat(document.getElementById('measure-time-3up').value),
            logTime: parseFloat(document.getElementById('log-time-3up').value),
            ptbTime: parseFloat(document.getElementById('ptb-time-3up').value),
            ptbRetry: parseInt(document.getElementById('ptb-retry-3up').value),
            beltTime: parseFloat(document.getElementById('belt-time-3up').value),
            opUnloadTime: parseFloat(document.getElementById('op-unload-time-3up').value)
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
let threeUpSimulation = null;