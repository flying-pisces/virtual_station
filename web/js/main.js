/**
 * Main JavaScript file for Virtual Station Simulations
 * Handles UI interactions and simulation management
 */

// Global variables
let currentSimulation = '1up';
let simulations = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSimulations();
    setupUIEventListeners();
    selectSimulation('1up'); // Start with 1-up simulation
});

function initializeSimulations() {
    // Create simulation instances
    simulations['1up'] = new OneUpSimulation();
    simulations['3up'] = new ThreeUpSimulation();
    
    // Set global references for UI access
    oneUpSimulation = simulations['1up'];
    threeUpSimulation = simulations['3up'];
}

function setupUIEventListeners() {
    // Simulation control buttons - 1up
    document.getElementById('start-1up').addEventListener('click', () => {
        if (simulations['1up'].updateFromUI()) {
            simulations['1up'].handleStart();
            updateControlButtons('1up', 'running');
        }
    });
    
    document.getElementById('pause-1up').addEventListener('click', () => {
        simulations['1up'].handlePause();
        updateControlButtons('1up', 'paused');
    });
    
    document.getElementById('reset-1up').addEventListener('click', () => {
        simulations['1up'].handleReset();
        updateControlButtons('1up', 'stopped');
    });

    // Speed control - 1up
    document.getElementById('speed-slider-1up').addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        simulations['1up'].handleSpeedChange(speed);
        document.getElementById('speed-1up').textContent = `${speed}x`;
    });

    // Simulation control buttons - 3up
    document.getElementById('start-3up').addEventListener('click', () => {
        if (simulations['3up'].updateFromUI()) {
            simulations['3up'].handleStart();
            updateControlButtons('3up', 'running');
        }
    });
    
    document.getElementById('pause-3up').addEventListener('click', () => {
        simulations['3up'].handlePause();
        updateControlButtons('3up', 'paused');
    });
    
    document.getElementById('reset-3up').addEventListener('click', () => {
        simulations['3up'].handleReset();
        updateControlButtons('3up', 'stopped');
    });

    // Speed control - 3up
    document.getElementById('speed-slider-3up').addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        simulations['3up'].handleSpeedChange(speed);
        document.getElementById('speed-3up').textContent = `${speed}x`;
    });

    // Input validation
    setupInputValidation();
}

function setupInputValidation() {
    // Add input validation for all numeric inputs
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            validateInput(this);
        });
    });
}

function validateInput(input) {
    const value = parseFloat(input.value);
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || Infinity;
    
    if (isNaN(value) || value < min || value > max) {
        input.style.borderColor = '#e74c3c';
        input.title = `Value must be between ${min} and ${max}`;
    } else {
        input.style.borderColor = '#ced4da';
        input.title = '';
    }
}

function selectSimulation(simType) {
    currentSimulation = simType;
    
    // Update navigation buttons
    document.querySelectorAll('.sim-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${simType}`).classList.add('active');
    
    // Show/hide simulation panels
    document.querySelectorAll('.simulation-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`sim-${simType}`).classList.add('active');
    
    // Reset control buttons
    updateControlButtons(simType, 'stopped');
}

function updateControlButtons(simType, state) {
    const startBtn = document.getElementById(`start-${simType}`);
    const pauseBtn = document.getElementById(`pause-${simType}`);
    const resetBtn = document.getElementById(`reset-${simType}`);
    
    switch(state) {
        case 'running':
            startBtn.textContent = 'Running';
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            resetBtn.disabled = false;
            break;
        case 'paused':
            startBtn.textContent = 'Resume';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
            break;
        case 'stopped':
            startBtn.textContent = 'Start';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            resetBtn.disabled = false;
            break;
    }
}

// Utility functions
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
    } else {
        return number.toString();
    }
}

// Export configuration data
function exportConfiguration(simType) {
    const config = simulations[simType].config;
    const metrics = simulations[simType].metrics;
    
    const exportData = {
        simulationType: simType,
        timestamp: new Date().toISOString(),
        configuration: config,
        currentMetrics: metrics
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${simType}-simulation-export-${Date.now()}.json`;
    link.click();
}

// Import configuration data
function importConfiguration(simType, file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.simulationType === simType && data.configuration) {
                // Update UI inputs with imported configuration
                updateUIInputs(simType, data.configuration);
                // Update simulation configuration
                simulations[simType].updateConfig(data.configuration);
                alert('Configuration imported successfully!');
            } else {
                alert('Invalid configuration file for this simulation type.');
            }
        } catch (error) {
            alert('Error reading configuration file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function updateUIInputs(simType, config) {
    // Update input fields based on simulation type
    if (simType === '1up') {
        document.getElementById('total-dut-1up').value = config.totalDUTs || 100;
        document.getElementById('good-dut-1up').value = config.goodPercent || 85;
        document.getElementById('relit-dut-1up').value = config.relitPercent || 10;
        document.getElementById('load-time-1up').value = config.loadTime || 10;
        document.getElementById('measure-time-1up').value = config.measureTime || 9;
        document.getElementById('ptb-time-1up').value = config.ptbTime || 5;
        document.getElementById('ptb-retry-1up').value = config.ptbRetry || 3;
        document.getElementById('unload-time-1up').value = config.unloadTime || 5;
    } else if (simType === '3up') {
        document.getElementById('total-dut-3up').value = config.totalDUTs || 5000;
        document.getElementById('good-dut-3up').value = config.goodPercent || 95;
        document.getElementById('relit-dut-3up').value = config.relitPercent || 3;
        document.getElementById('op-load-time-3up').value = config.opLoadTime || 13;
        document.getElementById('measure-time-3up').value = config.measureTime || 9;
        document.getElementById('log-time-3up').value = config.logTime || 8;
        document.getElementById('ptb-time-3up').value = config.ptbTime || 1;
        document.getElementById('ptb-retry-3up').value = config.ptbRetry || 3;
        document.getElementById('belt-time-3up').value = config.beltTime || 3;
        document.getElementById('op-unload-time-3up').value = config.opUnloadTime || 2;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case ' ': // Ctrl+Space to start/pause
                e.preventDefault();
                const sim = simulations[currentSimulation];
                if (sim.engine.running && !sim.engine.paused) {
                    sim.handlePause();
                } else {
                    if (sim.updateFromUI()) {
                        sim.handleStart();
                    }
                }
                break;
            case 'r': // Ctrl+R to reset
                e.preventDefault();
                simulations[currentSimulation].handleReset();
                break;
            case '1': // Ctrl+1 for 1-up simulation
                e.preventDefault();
                selectSimulation('1up');
                break;
            case '3': // Ctrl+3 for 3-up simulation
                e.preventDefault();
                selectSimulation('3up');
                break;
        }
    }
});

// Add help tooltip
function showHelp() {
    const helpText = `
Keyboard Shortcuts:
• Ctrl+Space: Start/Pause simulation
• Ctrl+R: Reset simulation
• Ctrl+1: Switch to 1-Up simulation
• Ctrl+3: Switch to 3-Up simulation

Simulation Controls:
• Adjust parameters before starting
• Use speed slider to control simulation rate
• Monitor real-time metrics
• Reset to clear all data and start over
    `;
    
    alert(helpText);
}

// Add a help button to the header
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    const helpBtn = document.createElement('button');
    helpBtn.textContent = '?';
    helpBtn.className = 'help-button';
    helpBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid #3498db;
        background: white;
        color: #3498db;
        font-weight: bold;
        cursor: pointer;
    `;
    helpBtn.onclick = showHelp;
    header.style.position = 'relative';
    header.appendChild(helpBtn);
});