# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JaamSim is a Java-based discrete-event simulation environment developed since 2002. This is a virtual station simulation project based on JaamSim with added functionality for 1-up stations and turn tables.

## Build and Development Commands

### Building the Project
```bash
# Build using Ant (as specified in README)
ant

# Build products will be in build/jars/
```

### Running the Application
```bash
# Run with a configuration file
java -jar JaamSim.jar config_file.cfg

# Example runs for the virtual station simulations
java -jar JaamSim2022-06.jar cfg/1up/1-up-station-simulation.cfg
java -jar JaamSim2022-06.jar cfg/3upturntable/Turn-table-simulation.cfg
```

### Testing
```bash
# Run all tests
java -cp build/jars/JaamSim.jar com.jaamsim.AllTests

# Tests are located in src/test/java/com/jaamsim/
```

## Project Architecture

### Core Architecture
- **Entity System**: Core simulation entities inherit from `Entity` class in `com.jaamsim.basicsim`
- **Event Management**: Discrete event simulation using `EventManager` and event scheduling
- **Input/Output System**: Comprehensive input parsing and validation system in `com.jaamsim.input`
- **3D Graphics**: JOGL-based 3D rendering system in `com.jaamsim.Graphics`

### Key Packages
- `com.jaamsim.basicsim` - Core simulation framework (Entity, JaamSimModel, Simulation)
- `com.jaamsim.events` - Event management and scheduling system
- `com.jaamsim.input` - Input parsing, validation, and expression evaluation
- `com.jaamsim.Graphics` - 3D graphics and visualization components
- `com.jaamsim.BasicObjects` - Basic simulation objects (generators, servers, queues)
- `com.jaamsim.ProcessFlow` - Process flow modeling objects
- `com.jaamsim.FluidObjects` - Fluid simulation components
- `com.jaamsim.ProbabilityDistributions` - Statistical distributions

### Virtual Station Specific
- Configuration files in `cfg/1up/` for 1-up station simulation
- Configuration files in `cfg/3upturntable/` for turn table simulation
- Custom graphics assets (PNG images) for station visualization

### Dependencies
- JOGL2 (Java OpenGL) for 3D graphics
- All dependencies are included in the `jar/` directory

### Configuration System
- Uses `.cfg` files for simulation configuration
- Includes predefined object palettes in `src/main/resources/resources/inputs/`
- Example configurations available in `src/main/resources/resources/examples/`

### Testing Structure
- JUnit tests organized by package in `src/test/java/com/jaamsim/`
- Comprehensive test coverage for math operations, events, parsing, and simulation components
- Test configuration files in `src/test/java/com/jaamsim/basicsim/`

## Web Implementation

A complete web-based version of the virtual station simulations is available in the `web/` directory.

### Web Structure
- `web/index.html` - Main simulation interface
- `web/js/simulation-engine.js` - Core discrete event simulation framework
- `web/js/1up-simulation.js` - 1-Up station simulation logic
- `web/js/3up-simulation.js` - 3-Up turn table simulation logic
- `web/js/main.js` - UI interaction and control logic
- `web/styles/main.css` - Complete styling and animations

### Web Features
- **Interactive Simulations**: Both 1-Up and 3-Up simulations with real-time controls
- **Live Parameter Adjustment**: Modify timing, DUT distributions, and operational settings
- **Real-time Metrics**: Utilization, downtime, throughput tracking
- **Visual Animations**: Station states, flow indicators, and turn table rotation
- **Speed Control**: 1x to 16x simulation speed
- **GitHub Pages Deployment**: Ready for web hosting

### Running Web Version
```bash
# Development server
cd web/
python -m http.server 8000
# Open http://localhost:8000

# Or open web/test.html for test suite
```

### Web Deployment
- **GitHub Pages**: Configured with `.github/workflows/deploy.yml`
- **Static Hosting**: No server requirements, runs entirely in browser
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices