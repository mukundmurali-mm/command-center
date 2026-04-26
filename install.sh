#!/bin/bash

set -e

echo "Installing Command Center..."

# Check for Node.js and Git
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed."
    exit 1
fi

# Installation directory
INSTALL_DIR="$HOME/.command-center-app"

if [ -d "$INSTALL_DIR" ]; then
    echo "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull
else
    echo "Cloning repository..."
    git clone https://github.com/mukundm/command-center "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo "Installing dependencies..."
npm install
npm run build

# Create local bin launcher
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

cat <<EOF > "$BIN_DIR/command-center"
#!/bin/bash
"$INSTALL_DIR/bin/command-center.js" "\$@"
EOF

chmod +x "$BIN_DIR/command-center"

echo "----------------------------------------------------------------"
echo "Installation complete!"
echo "Make sure $BIN_DIR is in your PATH."
echo "You can now start the app by running: command-center"
echo "----------------------------------------------------------------"

# Install as background service on macOS
if [[ "\$OSTYPE" == "darwin"* ]]; then
    echo "Installing macOS background service..."
    "$INSTALL_DIR/bin/command-center.js" --service install
fi
