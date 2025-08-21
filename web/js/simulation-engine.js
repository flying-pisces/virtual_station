/**
 * Core Simulation Engine
 * Provides base classes and functionality for discrete event simulations
 */

class SimulationEngine {
    constructor() {
        this.currentTime = 0;
        this.eventQueue = [];
        this.entities = [];
        this.running = false;
        this.paused = false;
        this.speedMultiplier = 1;
        this.startTime = null;
        this.lastUpdateTime = 0;
        this.updateInterval = null;
        this.listeners = {};
    }

    // Event management
    scheduleEvent(time, entity, eventType, data = {}) {
        const event = {
            time: this.currentTime + time,
            entity: entity,
            eventType: eventType,
            data: data
        };
        
        this.eventQueue.push(event);
        this.eventQueue.sort((a, b) => a.time - b.time);
    }

    processEvents() {
        while (this.eventQueue.length > 0 && this.eventQueue[0].time <= this.currentTime) {
            const event = this.eventQueue.shift();
            if (event.entity && event.entity.processEvent) {
                event.entity.processEvent(event.eventType, event.data);
            }
            this.emit('event', event);
        }
    }

    // Time management
    advanceTime(deltaTime) {
        this.currentTime += deltaTime * this.speedMultiplier;
        this.processEvents();
    }

    // Control methods
    start() {
        if (!this.running) {
            this.running = true;
            this.paused = false;
            this.startTime = Date.now();
            this.lastUpdateTime = this.currentTime;
            this.gameLoop();
            this.emit('start');
        } else if (this.paused) {
            this.paused = false;
            this.gameLoop();
            this.emit('resume');
        }
    }

    pause() {
        this.paused = true;
        if (this.updateInterval) {
            clearTimeout(this.updateInterval);
        }
        this.emit('pause');
    }

    stop() {
        this.running = false;
        this.paused = false;
        if (this.updateInterval) {
            clearTimeout(this.updateInterval);
        }
        this.emit('stop');
    }

    reset() {
        this.stop();
        this.currentTime = 0;
        this.eventQueue = [];
        this.entities.forEach(entity => {
            if (entity.reset) entity.reset();
        });
        this.emit('reset');
    }

    setSpeed(multiplier) {
        this.speedMultiplier = multiplier;
        this.emit('speedChange', multiplier);
    }

    // Main game loop
    gameLoop() {
        if (!this.running || this.paused) return;

        const frameTime = 100; // Update every 100ms
        this.advanceTime(frameTime / 1000); // Convert to seconds
        
        this.emit('update', {
            currentTime: this.currentTime,
            entities: this.entities
        });

        this.updateInterval = setTimeout(() => this.gameLoop(), frameTime);
    }

    // Entity management
    addEntity(entity) {
        entity.simulation = this;
        this.entities.push(entity);
        this.emit('entityAdded', entity);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            this.emit('entityRemoved', entity);
        }
    }

    // Event listener system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Base Entity class
class Entity {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.simulation = null;
        this.state = 'idle';
        this.startTime = 0;
        this.endTime = 0;
        this.totalTime = 0;
        this.workingTime = 0;
        this.numberProcessed = 0;
    }

    processEvent(eventType, data) {
        // Override in subclasses
    }

    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        
        if (this.simulation) {
            this.simulation.emit('entityStateChange', {
                entity: this,
                oldState: oldState,
                newState: newState
            });
        }
    }

    scheduleEvent(delay, eventType, data = {}) {
        if (this.simulation) {
            this.simulation.scheduleEvent(delay, this, eventType, data);
        }
    }

    reset() {
        this.state = 'idle';
        this.startTime = 0;
        this.endTime = 0;
        this.totalTime = 0;
        this.workingTime = 0;
        this.numberProcessed = 0;
    }
}

// DUT (Device Under Test) class
class DUT {
    constructor(id) {
        this.id = id;
        this.type = null; // 'good', 'relit', 'bad'
        this.creationTime = 0;
        this.attributes = {};
        this.currentStation = null;
        this.path = [];
    }

    setType(type) {
        this.type = type;
        this.attributes.goodPart = type === 'good' ? 1 : (type === 'relit' ? 2 : 3);
    }

    addToPath(station) {
        this.path.push({
            station: station,
            enterTime: this.currentStation ? this.currentStation.simulation.currentTime : 0
        });
    }
}

// Generator class
class Generator extends Entity {
    constructor(id, name, config) {
        super(id, name);
        this.config = {
            totalDUTs: config.totalDUTs || 100,
            interArrivalTime: config.interArrivalTime || 10,
            distribution: config.distribution || { good: 0.85, relit: 0.10, bad: 0.05 },
            ...config
        };
        this.generatedCount = 0;
        this.nextComponent = null;
    }

    start() {
        if (this.generatedCount < this.config.totalDUTs) {
            this.generateNextDUT();
        }
    }

    generateNextDUT() {
        const dut = new DUT(`DUT_${this.generatedCount + 1}`);
        dut.creationTime = this.simulation.currentTime;
        
        // Determine DUT type based on distribution
        const rand = Math.random();
        if (rand < this.config.distribution.good) {
            dut.setType('good');
        } else if (rand < this.config.distribution.good + this.config.distribution.relit) {
            dut.setType('relit');
        } else {
            dut.setType('bad');
        }

        this.generatedCount++;
        this.numberProcessed++;
        
        // Send to next component
        if (this.nextComponent) {
            this.nextComponent.receiveDUT(dut);
        }

        // Schedule next generation
        if (this.generatedCount < this.config.totalDUTs) {
            this.scheduleEvent(this.config.interArrivalTime, 'generate');
        }

        this.simulation.emit('dutGenerated', { generator: this, dut: dut });
    }

    processEvent(eventType, data) {
        if (eventType === 'generate') {
            this.generateNextDUT();
        }
    }

    reset() {
        super.reset();
        this.generatedCount = 0;
    }
}

// Queue class
class Queue extends Entity {
    constructor(id, name, config = {}) {
        super(id, name);
        this.config = {
            maxLength: config.maxLength || Infinity,
            ...config
        };
        this.duts = [];
        this.nextComponent = null;
    }

    receiveDUT(dut) {
        if (this.duts.length < this.config.maxLength) {
            this.duts.push(dut);
            dut.currentStation = this;
            dut.addToPath(this);
            
            this.simulation.emit('dutEnterQueue', { queue: this, dut: dut });
            
            // Notify next component if available
            if (this.nextComponent && this.nextComponent.isAvailable && this.nextComponent.isAvailable()) {
                this.sendNext();
            }
        }
    }

    sendNext() {
        if (this.duts.length > 0 && this.nextComponent) {
            const dut = this.duts.shift();
            this.nextComponent.receiveDUT(dut);
            this.simulation.emit('dutLeaveQueue', { queue: this, dut: dut });
        }
    }

    getQueueLength() {
        return this.duts.length;
    }

    isEmpty() {
        return this.duts.length === 0;
    }

    reset() {
        super.reset();
        this.duts = [];
    }
}

// Server class (processing station)
class Server extends Entity {
    constructor(id, name, config) {
        super(id, name);
        this.config = {
            serviceTime: config.serviceTime || 10,
            capacity: config.capacity || 1,
            ...config
        };
        this.currentDUTs = [];
        this.waitQueue = null;
        this.nextComponent = null;
        this.processingStartTime = 0;
    }

    isAvailable() {
        return this.currentDUTs.length < this.config.capacity;
    }

    receiveDUT(dut) {
        if (this.isAvailable()) {
            this.startProcessing(dut);
        } else if (this.waitQueue) {
            this.waitQueue.receiveDUT(dut);
        }
    }

    startProcessing(dut) {
        this.currentDUTs.push(dut);
        dut.currentStation = this;
        dut.addToPath(this);
        
        this.setState('working');
        this.processingStartTime = this.simulation.currentTime;
        
        const serviceTime = typeof this.config.serviceTime === 'function' 
            ? this.config.serviceTime(dut) 
            : this.config.serviceTime;
        
        this.scheduleEvent(serviceTime, 'finishProcessing', { dut: dut });
        
        this.simulation.emit('dutStartProcessing', { server: this, dut: dut });
    }

    finishProcessing(dut) {
        const index = this.currentDUTs.indexOf(dut);
        if (index !== -1) {
            this.currentDUTs.splice(index, 1);
            this.numberProcessed++;
            
            // Update working time
            this.workingTime += this.simulation.currentTime - this.processingStartTime;
            
            if (this.currentDUTs.length === 0) {
                this.setState('idle');
            }
            
            // Send to next component
            if (this.nextComponent) {
                this.nextComponent.receiveDUT(dut);
            }
            
            this.simulation.emit('dutFinishProcessing', { server: this, dut: dut });
            
            // Check if there are DUTs waiting
            if (this.waitQueue && !this.waitQueue.isEmpty()) {
                this.waitQueue.sendNext();
            }
        }
    }

    processEvent(eventType, data) {
        if (eventType === 'finishProcessing') {
            this.finishProcessing(data.dut);
        }
    }

    getUtilization() {
        if (this.simulation.currentTime === 0) return 0;
        return (this.workingTime / this.simulation.currentTime) * 100;
    }

    reset() {
        super.reset();
        this.currentDUTs = [];
        this.processingStartTime = 0;
    }
}

// Branch/Router class
class Branch extends Entity {
    constructor(id, name, config) {
        super(id, name);
        this.config = config;
        this.nextComponents = {};
    }

    receiveDUT(dut) {
        let targetComponent = null;
        
        // Route based on DUT type
        if (dut.type === 'good' && this.nextComponents.good) {
            targetComponent = this.nextComponents.good;
        } else if (dut.type === 'relit' && this.nextComponents.relit) {
            targetComponent = this.nextComponents.relit;
        } else if (dut.type === 'bad' && this.nextComponents.bad) {
            targetComponent = this.nextComponents.bad;
        }
        
        if (targetComponent) {
            targetComponent.receiveDUT(dut);
        }
        
        this.simulation.emit('dutRouted', { branch: this, dut: dut, target: targetComponent });
    }

    setNextComponent(type, component) {
        this.nextComponents[type] = component;
    }
}

// Sink class (end point)
class Sink extends Entity {
    constructor(id, name) {
        super(id, name);
        this.processedDUTs = [];
    }

    receiveDUT(dut) {
        this.processedDUTs.push(dut);
        this.numberProcessed++;
        dut.currentStation = this;
        dut.addToPath(this);
        
        this.simulation.emit('dutComplete', { sink: this, dut: dut });
    }

    reset() {
        super.reset();
        this.processedDUTs = [];
    }
}

// Export classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SimulationEngine,
        Entity,
        DUT,
        Generator,
        Queue,
        Server,
        Branch,
        Sink
    };
}