# Virtual Station Simulations - Web Version

A web-based implementation of JaamSim manufacturing station simulations, featuring interactive discrete event simulation for manufacturing test stations.

## Live Demo

🔗 **[Open Web Simulation](https://yourusername.github.io/virtual_station/web/)**

## Features

### 🏭 1-Up Station Simulation
- **Single station manufacturing simulation**
- DUT (Device Under Test) classification and routing
- Real-time performance metrics
- Interactive parameter adjustment
- Visual station flow representation

### 🔄 3-Up Turn Table Simulation  
- **Multi-station turn table manufacturing**
- Container-based processing workflow
- Complex routing for different DUT types
- Higher throughput processing simulation
- Turn table visualization with animated stations

### 🎛️ Interactive Controls
- **Real-time Configuration**: Adjust timing parameters, DUT distributions, and operational settings
- **Simulation Controls**: Start, pause, reset, and speed control (1x to 16x)
- **Live Metrics**: Real-time utilization, downtime, throughput, and completion tracking
- **Visual Feedback**: Animated station states and flow indicators

## Simulation Parameters

### 1-Up Station Parameters
- **DUT Distribution**: Good (85%), Re-lit (10%), Failed (5%)
- **Timing Controls**: Load time, measurement time, PTB time, unload time
- **Processing Logic**: Branch routing based on DUT quality
- **Metrics**: Utilization, downtime percentage, completion counts

### 3-Up Turn Table Parameters  
- **DUT Distribution**: Good (95%), Re-lit (3%), Failed (2%)
- **Station Operations**: Loading, AOI/Measurement, Data Logging
- **Container Management**: 3-container circulation system
- **Belt Transport**: Configurable conveyor timing between stations

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Simulation Engine**: Custom discrete event simulation framework
- **Visualization**: CSS animations and SVG graphics
- **Deployment**: GitHub Pages (static hosting)

## Architecture

### Core Components
```
simulation-engine.js    # Base discrete event simulation framework
├── SimulationEngine   # Main simulation controller
├── Entity             # Base entity class
├── DUT               # Device Under Test model
├── Generator         # DUT generation system
├── Queue             # Queuing system for entities
├── Server            # Processing stations
├── Branch            # Routing logic
└── Sink              # Completion endpoints

1up-simulation.js      # 1-Up station implementation
3up-simulation.js      # 3-Up turn table implementation
main.js               # UI controls and interaction management
```

### Event-Driven Architecture
- **Discrete Event Simulation**: Time-based event processing
- **Entity Lifecycle**: Creation → Processing → Routing → Completion
- **Real-time Updates**: Live metrics and visual feedback
- **Configurable Parameters**: Runtime adjustment of all simulation parameters

## Usage Instructions

### Getting Started
1. **Select Simulation**: Choose between 1-Up Station or 3-Up Turn Table
2. **Configure Parameters**: Adjust timing, DUT distribution, and operational settings
3. **Start Simulation**: Click "Start" to begin the discrete event simulation
4. **Monitor Progress**: Watch real-time metrics and visual station states
5. **Control Execution**: Use pause/resume and speed controls as needed

### Keyboard Shortcuts
- `Ctrl+Space`: Start/Pause simulation
- `Ctrl+R`: Reset simulation  
- `Ctrl+1`: Switch to 1-Up simulation
- `Ctrl+3`: Switch to 3-Up simulation

### Parameter Guidelines
- **DUT Percentages**: Good + Re-lit percentages must not exceed 100%
- **Timing Values**: All timing parameters must be positive values
- **Total DUT Count**: Recommended ranges: 100-1000 for 1-Up, 1000-10000 for 3-Up
- **Speed Control**: Use higher speeds (4x-16x) for faster results with large DUT counts

## Performance Metrics

### 1-Up Station Metrics
- **Total Time**: Complete simulation duration
- **Total Processed**: Successfully completed DUTs
- **Measurement Utilization**: Station efficiency percentage
- **Downtime Percentage**: Non-productive time ratio
- **DUT Type Counts**: Breakdown by Good, Re-lit, Failed

### 3-Up Turn Table Metrics
- **Station Completions**: Individual station throughput tracking
- **Total Completed DUT**: Overall production output
- **Measurement Utilization**: AOI station efficiency
- **Downtime Percentage**: System-wide downtime analysis
- **Container Utilization**: Turn table efficiency metrics

## Original JaamSim Comparison

This web implementation faithfully reproduces the behavior and metrics of the original JaamSim desktop simulations:

| Feature | JaamSim Original | Web Implementation |
|---------|-----------------|-------------------|
| **Simulation Logic** | Discrete Event | ✅ Discrete Event |
| **DUT Classification** | 3-tier (Good/Relit/Bad) | ✅ 3-tier (Good/Relit/Bad) |
| **Station Processing** | Time-based queuing | ✅ Time-based queuing |
| **Metrics Calculation** | Real-time statistics | ✅ Real-time statistics |
| **Visual Feedback** | 3D graphics | ✅ 2D animated graphics |
| **Parameter Control** | Configuration files | ✅ Interactive UI controls |

## Development

### Local Development
```bash
# Serve the web directory
cd web/
python -m http.server 8000
# Open http://localhost:8000
```

### File Structure
```
web/
├── index.html              # Main application page
├── styles/
│   └── main.css            # Application styling
├── js/
│   ├── simulation-engine.js # Core simulation framework
│   ├── 1up-simulation.js   # 1-Up station logic
│   ├── 3up-simulation.js   # 3-Up turn table logic
│   └── main.js             # UI interaction handling
└── README.md               # This documentation
```

## Deployment

### GitHub Pages Setup
1. **Repository**: Push web files to GitHub repository
2. **Pages Configuration**: Enable GitHub Pages from repository settings
3. **Custom Domain** (optional): Configure custom domain if desired
4. **Auto-deployment**: Pages will update automatically on push to main branch

### Direct Deployment
The simulation runs entirely in the browser with no server requirements:
- ✅ Static file hosting compatible
- ✅ CDN deployment ready  
- ✅ Offline capable
- ✅ Mobile responsive design

## Browser Compatibility

- **Chrome**: 80+ ✅
- **Firefox**: 75+ ✅
- **Safari**: 13+ ✅
- **Edge**: 80+ ✅

## Contributing

Contributions welcome! Areas for enhancement:
- Additional simulation scenarios
- Enhanced visualization options
- Performance optimizations
- Mobile interface improvements
- Export/import functionality

## License

This web implementation is based on the JaamSim discrete event simulation software, which is licensed under the Apache License, Version 2.0.

## Acknowledgments

- **JaamSim Development Team**: Original simulation software and concepts
- **Manufacturing Domain Experts**: Real-world station operation insights
- **Web Standards Community**: Modern browser APIs and best practices