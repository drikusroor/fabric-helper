# Fabric Helper 🎮

An automated Fabric mod installer that downloads and installs Minecraft Fabric mods and shaders with a single command.

**Now available in two versions:**
- 🚀 **Cross-platform TypeScript/Bun version** (Recommended - works on Windows, macOS, Linux)
- 🍎 **Bash version** (macOS/Linux only)

## Features

- ✨ **Automated Fabric Installation** - Installs Fabric Loader automatically
- 📥 **Automatic Mod Downloads** - Downloads mods from Modrinth API with version matching
- 🎨 **Shader Support** - Includes shader pack installation
- 💾 **Local Mod Support** - Add custom mods via the local `minecraft/mods` directory
- 🔄 **Smart Installation** - Checks for existing mods to avoid duplicates
- ⚙️ **Version Matching** - Ensures mods are compatible with your Minecraft version
- 🔐 **Safe Cleanup** - Backs up existing mods before cleanup
- � **Cross-Platform** - TypeScript version works on Windows, macOS, and Linux
- �🎯 **Minimal Dependencies** - TypeScript version only needs Bun and Java

## Prerequisites

### For TypeScript/Bun Version (Recommended)
- **Bun** (install from [bun.sh](https://bun.sh))
- **Java** (installed and available in PATH)
- `fabric-installer-1.1.0.jar` (place in the project root directory)

### For Bash Version (macOS/Linux only)
- **macOS or Linux**
- **Java** (installed and available in PATH)
- `curl` (usually pre-installed)
- `jq` (JSON processor - bash script will auto-install via Homebrew if missing)
- `fabric-installer-1.1.0.jar` (place in the project root directory)

## Project Structure

```
fabric-helper/
├── index.ts                      # TypeScript/Bun version (cross-platform)
├── fabric_helper.sh              # Bash version (macOS/Linux)
├── package.json                  # Bun project configuration
├── README.md                     # This file
├── minecraft/
│   ├── mods/                     # Place your local mods here (.jar files)
│   └── shaderpacks/              # Place your local shaders here (.zip or .jar files)
└── fabric-installer-1.1.0.jar    # Fabric installer (download separately)
```

## Setup Instructions

### 1. Download Fabric Installer

Download the Fabric Installer from [fabricmc.net](https://fabricmc.net/use/) and place the JAR file in the project root directory:

```bash
# Example - download and place in the right location
cd ~/repos/fabric-helper
curl -L -o fabric-installer-1.1.0.jar https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.1.0/fabric-installer-1.1.0.jar
```

### 2. Install Dependencies & Make Scripts Executable

**For TypeScript/Bun version:**
```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install
```

**For Bash version:**
```bash
chmod +x fabric_helper.sh
```

### 3. (Optional) Add Custom Mods

Place your custom mod files in the `minecraft/mods` directory:

```
minecraft/
└── mods/
    ├── my-custom-mod.jar
    └── another-mod.jar
```

Similarly, add custom shaders to `minecraft/shaderpacks`:

```
minecraft/
└── shaderpacks/
    ├── my-shader-pack.zip
    └── another-shader.jar
```

## Usage

### TypeScript/Bun Version (Recommended - Cross-Platform)

Run with Bun:

```bash
bun run start
```

Or directly:

```bash
bun index.ts
```

### Bash Version (macOS/Linux)

```bash
./fabric_helper.sh
```

### What Happens During Installation

Both versions will:

1. **Ask for Minecraft version** - Enter the version you want to install for (e.g., `1.21.10`, `1.20.4`)
2. **Ask about cleanup** - Optionally clean up existing mods (with automatic backup)
3. **Install Fabric Loader** - Automatically installs Fabric
4. **Create directories** - Sets up mods and shaderpacks folders
5. **Copy local mods** - Copies from `minecraft/mods` and `minecraft/shaderpacks`
6. **Download mods** - Automatically downloads missing mods from Modrinth

### Interactive Prompts

```
Please enter your Minecraft version (e.g., 1.21.10, 1.20.4):
Minecraft version: 1.21.10

Do you want to clean up existing mods/shaders before installing? (y/N)
Clean up: n
```

## Default Mods

The script automatically downloads and installs these mods:

- **Fabric API** - Core API for Fabric mods
- **Lamb Dynamic Lights** - Dynamic lighting effects
- **Mod Menu** - In-game mod configuration menu
- **Sodium** - Performance optimization
- **Xaero's Minimap** - In-game minimap
- **Xaero's World Map** - World mapping tool
- **Complementary Reimagined** - Shaders (optional)

## Where Files Go

### Local Mods (Before Running)

Place mods in your local directory before running the script:

```text
minecraft/mods/
├── custom-mod-1.jar
└── custom-mod-2.jar
```

**These are copied to:**

- **macOS:** `~/Library/Application Support/minecraft/mods`
- **Windows:** `%APPDATA%\.minecraft\mods`
- **Linux:** `~/.minecraft/mods`

### Downloaded Mods (After Running)

Mods are automatically installed to:

- **macOS:** `~/Library/Application Support/minecraft/mods/`
- **Windows:** `%APPDATA%\.minecraft\mods\`
- **Linux:** `~/.minecraft/mods/`

### Shaderpacks

Shaders are installed to:

- **macOS:** `~/Library/Application Support/minecraft/shaderpacks/`
- **Windows:** `%APPDATA%\.minecraft\shaderpacks\`
- **Linux:** `~/.minecraft/shaderpacks/`

## Backup Locations

If you choose to clean up existing mods, they are backed up to your Desktop:

```text
~/Desktop/minecraft_mods_backup_YYYY-MM-DD/
├── mods/
└── shaderpacks/
```

## Troubleshooting

### TypeScript/Bun version won't run

```bash
# Make sure Bun is installed
bun --version

# If not, install Bun
curl -fsSL https://bun.sh/install | bash

# On Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Bash script won't run (macOS/Linux)

```bash
# Make sure the script is executable
chmod +x fabric_helper.sh
```

### Java not found

```bash
# macOS/Linux - Install Java
brew install openjdk@21

# Windows - Download from https://adoptium.net/
```

### Bun script: "jq not installed" (only for bash version)

The TypeScript/Bun version doesn't need jq. If using the bash version:

```bash
# Install jq
brew install jq
```

### Mods not available for my Minecraft version

If some mods show as "not available for [version]", it means mod developers haven't released updates for that version yet. You can:

1. Check [modrinth.com](https://modrinth.com) for the latest available versions
2. Wait for mod developers to update their mods
3. Switch to a more recent Minecraft version that has more mod support

### Mods not loading in-game

1. Make sure you have Java installed and in your PATH
2. Verify the Fabric profile was created in Minecraft Launcher
3. Check that mods are in the correct directory: `~/Library/Application Support/minecraft/mods`
4. Start a new world or check world load logs

## Adding More Mods

To add additional mods to the automatic download list, edit `fabric_helper.sh` and modify the `MODS` array:

```bash
MODS=(
    "fabric-api|Fabric API"
    "your-new-mod-slug|Your New Mod"
    # Add more mods here
)
```

Find mod slugs on [modrinth.com](https://modrinth.com) in the URL or API.

## Contributing

Feel free to fork, improve, and submit pull requests!

## License

This project is provided as-is for personal use.

## Support

For issues with:

- **Mods**: Check [modrinth.com](https://modrinth.com)
- **Fabric**: Visit [fabricmc.net](https://fabricmc.net)
- **This script**: Check the script output and error messages

---

**Happy modding!** 🎮✨
