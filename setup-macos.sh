#!/bin/bash

# Setup script for JaamSim on macOS
# This script sets up environment variables for proper JOGL library loading on Apple Silicon

echo "Setting up JaamSim environment for macOS..."

# Check if running on Apple Silicon
if [ "$(uname -m)" = "arm64" ]; then
    echo "Detected Apple Silicon Mac - configuring JOGL native library path"
    
    # Get the absolute path to the current directory
    CURRENT_DIR="$(pwd)"
    export JAVA_TOOL_OPTIONS="-Djava.library.path=${CURRENT_DIR}/natives/macosx-universal -Djogamp.gluegen.UseTempJarCache=false"
    
    echo "Environment configured with: $JAVA_TOOL_OPTIONS"
    echo "You can now run:"
    echo "  java -jar cfg/JaamSim2022-06.jar cfg/1up/1-up-station-simulation.cfg"
    echo ""
    echo "To make this permanent, add this line to your shell profile (~/.zshrc or ~/.bash_profile):"
    echo "  export JAVA_TOOL_OPTIONS=\"-Djava.library.path=${CURRENT_DIR}/natives/macosx-universal -Djogamp.gluegen.UseTempJarCache=false\""
else
    echo "Intel Mac detected - no special configuration needed"
    echo "You can run JaamSim normally:"
    echo "  java -jar cfg/JaamSim2022-06.jar cfg/1up/1-up-station-simulation.cfg"
fi

echo ""
echo "Setup complete!"