#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_PORT=3633
PORT=$DEFAULT_PORT
PROJECT_PATH=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [-p port] [project_path]"
            echo ""
            echo "Options:"
            echo "  -p, --port PORT    Set the server port (default: $DEFAULT_PORT)"
            echo "  -h, --help         Show this help message"
            echo ""
            echo "Arguments:"
            echo "  project_path       Path to the project directory (default: parent of scripts folder)"
            exit 0
            ;;
        *)
            PROJECT_PATH="$1"
            shift
            ;;
    esac
done

# Determine project path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -z "$PROJECT_PATH" ]; then
    PROJECT_PATH="$(dirname "$SCRIPT_DIR")"
fi
PROJECT_PATH="$(cd "$PROJECT_PATH" && pwd)"

echo -e "${BLUE}=== 63bytes.com Service Registration ===${NC}"
echo ""
echo -e "Project path: ${GREEN}$PROJECT_PATH${NC}"
echo -e "Port: ${GREEN}$PORT${NC}"
echo ""

# Detect OS
OS="$(uname -s)"
echo -e "${BLUE}Detecting OS...${NC}"
case "$OS" in
    Darwin)
        echo -e "  OS: ${GREEN}macOS${NC}"
        ;;
    Linux)
        echo -e "  OS: ${GREEN}Linux${NC}"
        ;;
    *)
        echo -e "${RED}Error: Unsupported operating system: $OS${NC}"
        exit 1
        ;;
esac
echo ""

# Find Bun
echo -e "${BLUE}Locating Bun...${NC}"
BUN_PATH=""
BUN_LOCATIONS=(
    "$HOME/.bun/bin/bun"
    "/opt/homebrew/bin/bun"
    "/usr/local/bin/bun"
    "/usr/bin/bun"
)

for loc in "${BUN_LOCATIONS[@]}"; do
    if [ -x "$loc" ]; then
        BUN_PATH="$loc"
        break
    fi
done

# Fall back to PATH
if [ -z "$BUN_PATH" ]; then
    if command -v bun &> /dev/null; then
        BUN_PATH="$(command -v bun)"
    fi
fi

if [ -z "$BUN_PATH" ]; then
    echo -e "${RED}Error: Bun not found!${NC}"
    echo "Please install Bun: https://bun.sh"
    exit 1
fi

echo -e "  Bun found: ${GREEN}$BUN_PATH${NC}"

# Validate Bun works
BUN_VERSION=$("$BUN_PATH" --version 2>/dev/null) || {
    echo -e "${RED}Error: Bun binary exists but failed to execute${NC}"
    exit 1
}
echo -e "  Bun version: ${GREEN}$BUN_VERSION${NC}"
echo ""

# Read environment variables from .env.local
echo -e "${BLUE}Reading environment variables...${NC}"
ENV_FILE="$PROJECT_PATH/.env.local"
declare -a ENV_KEYS
declare -a ENV_VALUES

if [ -f "$ENV_FILE" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Skip lines without =
        [[ ! "$line" =~ = ]] && continue
        
        # Extract key and value
        key="${line%%=*}"
        value="${line#*=}"
        
        # Trim whitespace from key
        key="$(echo "$key" | xargs)"
        
        # Skip if key is empty
        [[ -z "$key" ]] && continue
        
        ENV_KEYS+=("$key")
        ENV_VALUES+=("$value")
        echo -e "  ${GREEN}✓${NC} $key"
    done < "$ENV_FILE"
    echo -e "  Loaded ${GREEN}${#ENV_KEYS[@]}${NC} environment variables from .env.local"
else
    echo -e "  ${YELLOW}Warning: .env.local not found, using defaults only${NC}"
fi
echo ""

# Function to generate plist environment entries to a file
generate_plist_env_file() {
    local outfile="$1"
    for i in "${!ENV_KEYS[@]}"; do
        echo "        <key>${ENV_KEYS[$i]}</key>" >> "$outfile"
        echo "        <string>${ENV_VALUES[$i]}</string>" >> "$outfile"
    done
}

# Function to generate systemd environment entries to a file
generate_systemd_env_file() {
    local outfile="$1"
    for i in "${!ENV_KEYS[@]}"; do
        echo "Environment=${ENV_KEYS[$i]}=${ENV_VALUES[$i]}" >> "$outfile"
    done
}

# Verify project structure
echo -e "${BLUE}Verifying project structure...${NC}"
if [ ! -f "$PROJECT_PATH/package.json" ]; then
    echo -e "${RED}Error: package.json not found in $PROJECT_PATH${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} package.json found"
echo ""

# Install dependencies and build
echo -e "${BLUE}Installing dependencies...${NC}"
cd "$PROJECT_PATH"
"$BUN_PATH" install
echo ""

echo -e "${BLUE}Building project...${NC}"
"$BUN_PATH" run build
echo ""

# macOS launchctl installation
install_macos_service() {
    echo -e "${BLUE}Installing macOS launchctl service...${NC}"
    
    PLIST_TEMPLATE="$SCRIPT_DIR/63bytes.plist"
    PLIST_DEST="$HOME/Library/LaunchAgents/com.63bytes.web.plist"
    LOG_DIR="$HOME/Library/Logs/63bytes"
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    echo -e "  ${GREEN}✓${NC} Log directory created: $LOG_DIR"
    
    # Unload existing service if present
    if launchctl list | grep -q "com.63bytes.web"; then
        echo -e "  ${YELLOW}Unloading existing service...${NC}"
        launchctl unload "$PLIST_DEST" 2>/dev/null || true
    fi
    
    # Generate plist with actual values
    sed -e "s|__PROJECT_PATH__|$PROJECT_PATH|g" \
        -e "s|__BUN_PATH__|$BUN_PATH|g" \
        -e "s|__PORT__|$PORT|g" \
        -e "s|__LOG_DIR__|$LOG_DIR|g" \
        "$PLIST_TEMPLATE" > "$PLIST_DEST"
    
    # Insert custom environment variables into plist
    if [ ${#ENV_KEYS[@]} -gt 0 ]; then
        TEMP_PLIST=$(mktemp)
        ENV_TEMP=$(mktemp)
        generate_plist_env_file "$ENV_TEMP"
        
        while IFS= read -r line; do
            echo "$line" >> "$TEMP_PLIST"
            if [[ "$line" == *"<string>production</string>"* ]]; then
                cat "$ENV_TEMP" >> "$TEMP_PLIST"
            fi
        done < "$PLIST_DEST"
        
        mv "$TEMP_PLIST" "$PLIST_DEST"
        rm -f "$ENV_TEMP"
    fi
    
    echo -e "  ${GREEN}✓${NC} Service file installed: $PLIST_DEST"
    
    # Load the service
    launchctl load "$PLIST_DEST"
    echo -e "  ${GREEN}✓${NC} Service loaded"
    
    echo ""
    echo -e "${GREEN}=== macOS Service Installed Successfully ===${NC}"
    echo ""
    echo "Commands:"
    echo "  Start:   launchctl load ~/Library/LaunchAgents/com.63bytes.web.plist"
    echo "  Stop:    launchctl unload ~/Library/LaunchAgents/com.63bytes.web.plist"
    echo "  Status:  launchctl list | grep 63bytes"
    echo "  Logs:    tail -f $LOG_DIR/63bytes.log"
    echo ""
    echo -e "Server running at: ${GREEN}http://localhost:$PORT${NC}"
}

# Linux systemd installation
install_linux_service() {
    echo -e "${BLUE}Installing Linux systemd user service...${NC}"
    
    SERVICE_TEMPLATE="$SCRIPT_DIR/63bytes.service"
    SYSTEMD_DIR="$HOME/.config/systemd/user"
    SERVICE_DEST="$SYSTEMD_DIR/63bytes.service"
    
    # Create systemd user directory
    mkdir -p "$SYSTEMD_DIR"
    echo -e "  ${GREEN}✓${NC} Systemd user directory created: $SYSTEMD_DIR"
    
    # Stop existing service if running
    if systemctl --user is-active --quiet 63bytes 2>/dev/null; then
        echo -e "  ${YELLOW}Stopping existing service...${NC}"
        systemctl --user stop 63bytes
    fi
    
    # Generate service file with actual values
    sed -e "s|__PROJECT_PATH__|$PROJECT_PATH|g" \
        -e "s|__BUN_PATH__|$BUN_PATH|g" \
        -e "s|__PORT__|$PORT|g" \
        "$SERVICE_TEMPLATE" > "$SERVICE_DEST"
    
    # Insert custom environment variables into service file
    if [ ${#ENV_KEYS[@]} -gt 0 ]; then
        TEMP_SERVICE=$(mktemp)
        ENV_TEMP=$(mktemp)
        generate_systemd_env_file "$ENV_TEMP"
        
        while IFS= read -r line; do
            echo "$line" >> "$TEMP_SERVICE"
            if [[ "$line" == "Environment=NODE_ENV=production" ]]; then
                cat "$ENV_TEMP" >> "$TEMP_SERVICE"
            fi
        done < "$SERVICE_DEST"
        
        mv "$TEMP_SERVICE" "$SERVICE_DEST"
        rm -f "$ENV_TEMP"
    fi
    
    echo -e "  ${GREEN}✓${NC} Service file installed: $SERVICE_DEST"
    
    # Reload systemd and enable service
    systemctl --user daemon-reload
    systemctl --user enable 63bytes
    systemctl --user start 63bytes
    
    echo -e "  ${GREEN}✓${NC} Service enabled and started"
    
    echo ""
    echo -e "${GREEN}=== Linux Service Installed Successfully ===${NC}"
    echo ""
    echo "Commands:"
    echo "  Start:   systemctl --user start 63bytes"
    echo "  Stop:    systemctl --user stop 63bytes"
    echo "  Status:  systemctl --user status 63bytes"
    echo "  Logs:    journalctl --user -u 63bytes -f"
    echo ""
    echo -e "Server running at: ${GREEN}http://localhost:$PORT${NC}"
}

# Install service based on OS
case "$OS" in
    Darwin)
        install_macos_service
        ;;
    Linux)
        install_linux_service
        ;;
esac
