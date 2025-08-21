#!/bin/bash

# JaamSim launcher script for macOS
# This script ensures proper JOGL library loading on Apple Silicon

# Set the script directory as the working directory
cd "$(dirname "$0")"

# Check if running on Apple Silicon
if [ "$(uname -m)" = "arm64" ]; then
    # Use local native libraries to avoid JOGL temp extraction issues on Apple Silicon
    exec java -Djava.library.path=natives/macosx-universal -Djogamp.gluegen.UseTempJarCache=false -jar cfg/JaamSim2022-06.jar "$@"
else
    # Standard launch for Intel Macs
    exec java -jar cfg/JaamSim2022-06.jar "$@"
fi