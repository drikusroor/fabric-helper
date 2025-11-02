#!/bin/bash

# Automated Fabric Mod Installer for macOS
# Downloads and installs Fabric + all mods automatically

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Automated Fabric Mod Installer       ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Configuration
INSTALLER="fabric-installer-1.1.0.jar"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_MODS_DIR="$SCRIPT_DIR/minecraft/mods"
LOCAL_SHADERS_DIR="$SCRIPT_DIR/minecraft/shaderpacks"
MINECRAFT_DIR="$HOME/Library/Application Support/minecraft"
MODS_DIR="$MINECRAFT_DIR/mods"
SHADERPACKS_DIR="$MINECRAFT_DIR/shaderpacks"
API_BASE="https://api.modrinth.com/v2"
USER_AGENT="fabric-installer-script/1.0 (contact@example.com)"

# Prompt for Minecraft version
echo -e "${YELLOW}Please enter your Minecraft version (e.g., 1.21.10, 1.20.4):${NC}"
read -p "Minecraft version: " MC_VERSION

if [ -z "$MC_VERSION" ]; then
    echo -e "${RED}Error: Minecraft version is required!${NC}"
    exit 1
fi

# Ask about cleanup
echo ""
echo -e "${YELLOW}Do you want to clean up existing mods/shaders before installing? (y/N)${NC}"
read -p "Clean up: " CLEANUP_CHOICE

echo ""
echo -e "${GREEN}Installing for Minecraft ${MC_VERSION}${NC}"
echo ""

# Check prerequisites
if [ ! -f "$INSTALLER" ]; then
    echo -e "${RED}Error: $INSTALLER not found!${NC}"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo -e "${RED}Error: Java is not installed!${NC}"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed!${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Installing via Homebrew...${NC}"
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo -e "${RED}Error: Homebrew not found. Please install jq manually: brew install jq${NC}"
        exit 1
    fi
fi

# Function to check if mod already exists in destination
check_existing_mod() {
    local FILENAME="$1"
    local IS_SHADER="$2"
    
    if [ "$IS_SHADER" = "true" ]; then
        local SEARCH_DIR="$SHADERPACKS_DIR"
    else
        local SEARCH_DIR="$MODS_DIR"
    fi
    
    if [ -f "$SEARCH_DIR/$FILENAME" ]; then
        return 0
    fi
    return 1
}

# Function to check if mod slug matches filename
mod_matches_filename() {
    local FILENAME="$1"
    local PROJECT_SLUG="$2"
    
    # Convert both to lowercase for comparison
    local FILENAME_LOWER=$(echo "$FILENAME" | tr '[:upper:]' '[:lower:]')
    local SLUG_LOWER=$(echo "$PROJECT_SLUG" | tr '[:upper:]' '[:lower:]')
    local SLUG_UNDERSCORE=$(echo "$SLUG_LOWER" | tr '-' '_')
    
    # Check if filename contains the slug (with - or _)
    if [[ "$FILENAME_LOWER" == *"$SLUG_LOWER"* ]] || [[ "$FILENAME_LOWER" == *"$SLUG_UNDERSCORE"* ]]; then
        return 0
    fi
    return 1
}

# Function to download mod from Modrinth
download_mod() {
    local PROJECT_SLUG="$1"
    local DISPLAY_NAME="$2"
    local IS_SHADER="$3"
    
    echo -e "${BLUE}Downloading ${DISPLAY_NAME}...${NC}"
    
    # Construct API URL with exact version match only
    local ENCODED_VERSION=$(echo "$MC_VERSION" | jq -sRr @uri)
    local API_URL="${API_BASE}/project/${PROJECT_SLUG}/version?loaders=[%22fabric%22]&game_versions=[%22${ENCODED_VERSION}%22]"
    
    local VERSIONS=$(curl -s -A "$USER_AGENT" "$API_URL")
    
    if [ -z "$VERSIONS" ] || [ "$VERSIONS" = "[]" ] || [ "$VERSIONS" = "null" ]; then
        echo -e "${YELLOW}  ⚠ No version available for Minecraft ${MC_VERSION}${NC}"
        return 1
    fi
    
    # Get the first (latest) version's download URL
    local DOWNLOAD_URL=$(echo "$VERSIONS" | jq -r '.[0].files[0].url' 2>/dev/null)
    local FILENAME=$(echo "$VERSIONS" | jq -r '.[0].files[0].filename' 2>/dev/null)
    local VERSION_NUMBER=$(echo "$VERSIONS" | jq -r '.[0].version_number' 2>/dev/null)
    
    if [ -z "$DOWNLOAD_URL" ] || [ "$DOWNLOAD_URL" = "null" ]; then
        echo -e "${YELLOW}  ⚠ No compatible version found for ${DISPLAY_NAME}${NC}"
        return 1
    fi
    
    echo -e "${CYAN}  ℹ Found: ${VERSION_NUMBER}${NC}"
    
    # Determine destination directory
    if [ "$IS_SHADER" = "true" ]; then
        local DEST="$SHADERPACKS_DIR/$FILENAME"
    else
        local DEST="$MODS_DIR/$FILENAME"
    fi
    
    # Download the file
    if curl -L -A "$USER_AGENT" -o "$DEST" "$DOWNLOAD_URL" 2>/dev/null; then
        echo -e "${GREEN}  ✓ Downloaded ${FILENAME}${NC}"
        return 0
    else
        echo -e "${RED}  ✗ Failed to download ${DISPLAY_NAME}${NC}"
        return 1
    fi
}

# Step 1: Install Fabric
echo -e "${GREEN}[1/5] Installing Fabric Loader...${NC}"
java -jar "$INSTALLER" client -dir "$MINECRAFT_DIR" -mcversion "$MC_VERSION"
echo ""

# Step 2: Create directories
echo -e "${GREEN}[2/5] Creating directories...${NC}"
mkdir -p "$MODS_DIR"
mkdir -p "$SHADERPACKS_DIR"
echo -e "${GREEN}  ✓ Mods directory: $MODS_DIR${NC}"
echo -e "${GREEN}  ✓ Shaderpacks directory: $SHADERPACKS_DIR${NC}"
echo ""

# Step 3: Cleanup if requested
if [[ "$CLEANUP_CHOICE" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}[3/5] Cleaning up existing mods and shaders...${NC}"
    
    # Backup first
    BACKUP_DIR="$HOME/Desktop/minecraft_mods_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR/mods"
    mkdir -p "$BACKUP_DIR/shaderpacks"
    
    if [ -d "$MODS_DIR" ] && [ "$(ls -A "$MODS_DIR" 2>/dev/null)" ]; then
        echo -e "${CYAN}  ℹ Backing up mods to: $BACKUP_DIR/mods${NC}"
        cp -r "$MODS_DIR"/* "$BACKUP_DIR/mods/" 2>/dev/null || true
        rm -f "$MODS_DIR"/*.jar 2>/dev/null || true
        echo -e "${GREEN}  ✓ Cleaned up mods directory${NC}"
    fi
    
    if [ -d "$SHADERPACKS_DIR" ] && [ "$(ls -A "$SHADERPACKS_DIR" 2>/dev/null)" ]; then
        echo -e "${CYAN}  ℹ Backing up shaders to: $BACKUP_DIR/shaderpacks${NC}"
        cp -r "$SHADERPACKS_DIR"/* "$BACKUP_DIR/shaderpacks/" 2>/dev/null || true
        rm -f "$SHADERPACKS_DIR"/*.zip 2>/dev/null || true
        rm -f "$SHADERPACKS_DIR"/*.jar 2>/dev/null || true
        echo -e "${GREEN}  ✓ Cleaned up shaderpacks directory${NC}"
    fi
    
    echo -e "${CYAN}  ℹ Backup saved to Desktop${NC}"
    echo ""
else
    echo -e "${GREEN}[3/5] Skipping cleanup...${NC}"
    echo ""
fi

# Step 4: Copy local mods and shaders
echo -e "${GREEN}[4/5] Installing local mods and shaders...${NC}"
echo ""

LOCAL_COPY_COUNT=0

# Copy local mods
if [ -d "$LOCAL_MODS_DIR" ]; then
    echo -e "${CYAN}Checking local mods directory: $LOCAL_MODS_DIR${NC}"
    for mod_file in "$LOCAL_MODS_DIR"/*.jar; do
        if [ -f "$mod_file" ]; then
            FILENAME=$(basename "$mod_file")
            if check_existing_mod "$FILENAME" "false"; then
                echo -e "${CYAN}  ℹ ${FILENAME} already exists, skipping${NC}"
            else
                cp "$mod_file" "$MODS_DIR/"
                echo -e "${GREEN}  ✓ Copied ${FILENAME}${NC}"
                ((LOCAL_COPY_COUNT++))
            fi
        fi
    done
else
    echo -e "${YELLOW}  ⚠ Local mods directory not found: $LOCAL_MODS_DIR${NC}"
fi

echo ""

# Copy local shaders
if [ -d "$LOCAL_SHADERS_DIR" ]; then
    echo -e "${CYAN}Checking local shaders directory: $LOCAL_SHADERS_DIR${NC}"
    for shader_file in "$LOCAL_SHADERS_DIR"/*; do
        if [ -f "$shader_file" ]; then
            FILENAME=$(basename "$shader_file")
            if check_existing_mod "$FILENAME" "true"; then
                echo -e "${CYAN}  ℹ ${FILENAME} already exists, skipping${NC}"
            else
                cp "$shader_file" "$SHADERPACKS_DIR/"
                echo -e "${GREEN}  ✓ Copied ${FILENAME}${NC}"
                ((LOCAL_COPY_COUNT++))
            fi
        fi
    done
else
    echo -e "${YELLOW}  ⚠ Local shaderpacks directory not found: $LOCAL_SHADERS_DIR${NC}"
fi

echo ""
echo -e "${CYAN}Copied ${LOCAL_COPY_COUNT} file(s) from local directories${NC}"
echo ""

# Step 5: Download missing mods
echo -e "${GREEN}[5/5] Downloading missing mods...${NC}"
echo ""

# Mod list - slug|display name pairs
MODS=(
    "fabric-api|Fabric API"
    "lambdynamiclights|Lamb Dynamic Lights"
    "modmenu|Mod Menu"
    "sodium|Sodium"
    "xaeros-minimap|Xaero's Minimap"
    "xaeros-world-map|Xaero's World Map"
)

# Check which mods are needed
SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for mod in "${MODS[@]}"; do
    IFS='|' read -r slug name <<< "$mod"
    
    # Check if this mod already exists (from local copy or previous install)
    FOUND=false
    if [ -d "$MODS_DIR" ]; then
        for existing_file in "$MODS_DIR"/*.jar; do
            if [ -f "$existing_file" ]; then
                FILENAME=$(basename "$existing_file")
                if mod_matches_filename "$FILENAME" "$slug"; then
                    echo -e "${CYAN}${name} already installed: ${FILENAME}${NC}"
                    FOUND=true
                    ((SKIP_COUNT++))
                    break
                fi
            fi
        done
    fi
    
    # Download if not found
    if [ "$FOUND" = false ]; then
        if download_mod "$slug" "$name" "false"; then
            ((SUCCESS_COUNT++))
        else
            ((FAIL_COUNT++))
        fi
    fi
    
    sleep 0.5  # Rate limiting
done

echo ""

# Download shader if missing
SHADER_FOUND=false
if [ -d "$SHADERPACKS_DIR" ]; then
    for existing_file in "$SHADERPACKS_DIR"/*; do
        if [ -f "$existing_file" ]; then
            FILENAME=$(basename "$existing_file")
            if mod_matches_filename "$FILENAME" "complementary"; then
                echo -e "${CYAN}Complementary Reimagined already installed: ${FILENAME}${NC}"
                SHADER_FOUND=true
                ((SKIP_COUNT++))
                break
            fi
        fi
    done
fi

if [ "$SHADER_FOUND" = false ]; then
    if download_mod "complementary-reimagined" "Complementary Reimagined" "true"; then
        ((SUCCESS_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Installation Summary         ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${GREEN}✓ Copied from local: ${LOCAL_COPY_COUNT}${NC}"
echo -e "${GREEN}✓ Downloaded: ${SUCCESS_COUNT}${NC}"
echo -e "${CYAN}ℹ Already installed: ${SKIP_COUNT}${NC}"
echo -e "${YELLOW}⚠ Not available for ${MC_VERSION}: ${FAIL_COUNT}${NC}"
echo ""

TOTAL_INSTALLED=$((LOCAL_COPY_COUNT + SUCCESS_COUNT + SKIP_COUNT))

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All ${TOTAL_INSTALLED} mods and shaders are ready!${NC}"
elif [ $SUCCESS_COUNT -gt 0 ] || [ $LOCAL_COPY_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠ ${TOTAL_INSTALLED} mods installed, but ${FAIL_COUNT} are not yet available for Minecraft ${MC_VERSION}.${NC}"
    echo -e "${YELLOW}   Check back later at https://modrinth.com${NC}"
else
    echo -e "${RED}⚠ No mods could be downloaded for Minecraft ${MC_VERSION}.${NC}"
    echo -e "${YELLOW}   Most mods may not be updated yet. You can:${NC}"
    echo -e "${YELLOW}   1. Wait for mod developers to release ${MC_VERSION} versions${NC}"
    echo -e "${YELLOW}   2. Check manually at https://modrinth.com${NC}"
fi

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Launch Minecraft"
echo "2. Select the Fabric profile (should be auto-created)"
echo "3. Only the compatible mods will load"
echo ""
echo -e "${CYAN}Tip: Keep your local minecraft/mods folder updated for easy reinstalls!${NC}"
echo ""