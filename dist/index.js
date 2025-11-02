#!/usr/bin/env bun
// @bun

// index.ts
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync
} from "fs";
import { homedir } from "os";
import { join } from "path";
var {$ } = globalThis.Bun;
var colors = {
  green: "\x1B[0;32m",
  blue: "\x1B[0;34m",
  yellow: "\x1B[1;33m",
  red: "\x1B[0;31m",
  cyan: "\x1B[0;36m",
  reset: "\x1B[0m"
};
function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}
function getMinecraftDir() {
  const platform = process.platform;
  if (platform === "darwin") {
    return join(homedir(), "Library/Application Support/minecraft");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA;
    if (!appData) {
      throw new Error("APPDATA environment variable not found on Windows");
    }
    return join(appData, ".minecraft");
  }
  return join(homedir(), ".minecraft");
}
var INSTALLER = "fabric-installer-1.1.0.jar";
var INSTALLER_URL = "https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.1.0/fabric-installer-1.1.0.jar";
var SCRIPT_DIR = import.meta.dir;
var LOCAL_MODS_DIR = join(SCRIPT_DIR, "minecraft", "mods");
var LOCAL_SHADERS_DIR = join(SCRIPT_DIR, "minecraft", "shaderpacks");
var MINECRAFT_DIR = getMinecraftDir();
var MODS_DIR = join(MINECRAFT_DIR, "mods");
var SHADERPACKS_DIR = join(MINECRAFT_DIR, "shaderpacks");
var API_BASE = "https://api.modrinth.com/v2";
var USER_AGENT = "fabric-installer-script/2.0 (bun)";
var MODS = [
  { slug: "fabric-api", name: "Fabric API" },
  { slug: "lambdynamiclights", name: "Lamb Dynamic Lights" },
  { slug: "modmenu", name: "Mod Menu" },
  { slug: "sodium", name: "Sodium" },
  { slug: "xaeros-minimap", name: "Xaero's Minimap" },
  { slug: "xaeros-world-map", name: "Xaero's World Map" }
];
function checkExistingFile(filename, isShader) {
  const searchDir = isShader ? SHADERPACKS_DIR : MODS_DIR;
  return existsSync(join(searchDir, filename));
}
function modMatchesFilename(filename, projectSlug) {
  const filenameLower = filename.toLowerCase();
  const slugLower = projectSlug.toLowerCase();
  const slugUnderscore = slugLower.replace(/-/g, "_");
  return filenameLower.includes(slugLower) || filenameLower.includes(slugUnderscore);
}
async function downloadMod(projectSlug, displayName, isShader, mcVersion) {
  log("blue", `Downloading ${displayName}...`);
  try {
    const encodedVersion = encodeURIComponent(mcVersion);
    const apiUrl = `${API_BASE}/project/${projectSlug}/version?loaders=["fabric"]&game_versions=["${encodedVersion}"]`;
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": USER_AGENT }
    });
    if (!response.ok) {
      log("yellow", `  \u26A0 API error for ${displayName}`);
      return false;
    }
    const versions = await response.json();
    if (!versions || versions.length === 0) {
      log("yellow", `  \u26A0 No version available for Minecraft ${mcVersion}`);
      return false;
    }
    const latestVersion = versions[0];
    if (!latestVersion) {
      log("yellow", `  \u26A0 No compatible version found for ${displayName}`);
      return false;
    }
    const file = latestVersion.files[0];
    if (!file) {
      log("yellow", `  \u26A0 No file available for ${displayName}`);
      return false;
    }
    log("cyan", `  \u2139 Found: ${latestVersion.version_number}`);
    const dest = join(isShader ? SHADERPACKS_DIR : MODS_DIR, file.filename);
    const fileResponse = await fetch(file.url, {
      headers: { "User-Agent": USER_AGENT }
    });
    if (!fileResponse.ok) {
      log("red", `  \u2717 Failed to download ${displayName}`);
      return false;
    }
    const arrayBuffer = await fileResponse.arrayBuffer();
    await Bun.write(dest, arrayBuffer);
    log("green", `  \u2713 Downloaded ${file.filename}`);
    return true;
  } catch (error) {
    log("red", `  \u2717 Error downloading ${displayName}: ${error}`);
    return false;
  }
}
function findExistingMod(slug, searchDir) {
  if (!existsSync(searchDir))
    return null;
  const files = readdirSync(searchDir);
  for (const file of files) {
    if (file.endsWith(".jar") && modMatchesFilename(file, slug)) {
      return file;
    }
  }
  return null;
}
function findExistingShader(slug) {
  if (!existsSync(SHADERPACKS_DIR))
    return null;
  const files = readdirSync(SHADERPACKS_DIR);
  for (const file of files) {
    if (modMatchesFilename(file, slug)) {
      return file;
    }
  }
  return null;
}
async function ensureFabricInstaller() {
  if (existsSync(INSTALLER)) {
    log("cyan", `  \u2139 Fabric installer already present: ${INSTALLER}`);
    return;
  }
  log("blue", "Downloading Fabric Installer...");
  try {
    const response = await fetch(INSTALLER_URL, {
      headers: { "User-Agent": USER_AGENT }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    await Bun.write(INSTALLER, arrayBuffer);
    log("green", `  \u2713 Downloaded ${INSTALLER}`);
  } catch (error) {
    log("red", `  \u2717 Failed to download Fabric Installer: ${error}`);
    log("yellow", `  You can manually download from: ${INSTALLER_URL}`);
    process.exit(1);
  }
}
async function main() {
  log("blue", "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  log("blue", "\u2551  Automated Fabric Mod Installer       \u2551");
  log("blue", "\u2551  Cross-Platform Edition (Bun)         \u2551");
  log("blue", "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log();
  const mcVersionPrompt = prompt(`${colors.yellow}Please enter your Minecraft version (e.g., 1.21.10, 1.20.4):${colors.reset}`);
  if (!mcVersionPrompt) {
    log("red", "Error: Minecraft version is required!");
    process.exit(1);
  }
  const mcVersion = mcVersionPrompt.trim();
  console.log();
  const cleanupPrompt = prompt(`${colors.yellow}Do you want to clean up existing mods/shaders before installing? (y/N)${colors.reset}`);
  const shouldCleanup = cleanupPrompt?.toLowerCase() === "y";
  console.log();
  log("green", `Installing for Minecraft ${mcVersion}`);
  console.log();
  log("green", "[0/5] Checking Fabric Installer...");
  await ensureFabricInstaller();
  console.log();
  try {
    await $`java -version`.quiet();
  } catch {
    log("red", "Error: Java is not installed!");
    log("yellow", "Install Java to continue.");
    process.exit(1);
  }
  log("green", "[1/5] Installing Fabric Loader...");
  try {
    await $`java -jar ${INSTALLER} client -dir ${MINECRAFT_DIR} -mcversion ${mcVersion}`;
  } catch {
    log("red", "Failed to install Fabric. Check your Minecraft version.");
    process.exit(1);
  }
  console.log();
  log("green", "[2/5] Creating directories...");
  mkdirSync(MODS_DIR, { recursive: true });
  mkdirSync(SHADERPACKS_DIR, { recursive: true });
  log("green", `  \u2713 Mods directory: ${MODS_DIR}`);
  log("green", `  \u2713 Shaderpacks directory: ${SHADERPACKS_DIR}`);
  console.log();
  if (shouldCleanup) {
    log("green", "[3/5] Cleaning up existing mods and shaders...");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const backupDir = join(homedir(), process.platform === "win32" ? "Desktop" : "Desktop", `minecraft_mods_backup_${timestamp}`);
    const backupModsDir = join(backupDir, "mods");
    const backupShadersDir = join(backupDir, "shaderpacks");
    mkdirSync(backupModsDir, { recursive: true });
    mkdirSync(backupShadersDir, { recursive: true });
    if (existsSync(MODS_DIR)) {
      const modFiles = readdirSync(MODS_DIR).filter((f) => f.endsWith(".jar"));
      if (modFiles.length > 0) {
        log("cyan", `  \u2139 Backing up mods to: ${backupModsDir}`);
        for (const file of modFiles) {
          copyFileSync(join(MODS_DIR, file), join(backupModsDir, file));
          rmSync(join(MODS_DIR, file));
        }
        log("green", "  \u2713 Cleaned up mods directory");
      }
    }
    if (existsSync(SHADERPACKS_DIR)) {
      const shaderFiles = readdirSync(SHADERPACKS_DIR);
      if (shaderFiles.length > 0) {
        log("cyan", `  \u2139 Backing up shaders to: ${backupShadersDir}`);
        for (const file of shaderFiles) {
          copyFileSync(join(SHADERPACKS_DIR, file), join(backupShadersDir, file));
          rmSync(join(SHADERPACKS_DIR, file));
        }
        log("green", "  \u2713 Cleaned up shaderpacks directory");
      }
    }
    log("cyan", "  \u2139 Backup saved to Desktop");
    console.log();
  } else {
    log("green", "[3/5] Skipping cleanup...");
    console.log();
  }
  log("green", "[4/5] Installing local mods and shaders...");
  console.log();
  let localCopyCount = 0;
  if (existsSync(LOCAL_MODS_DIR)) {
    log("cyan", `Checking local mods directory: ${LOCAL_MODS_DIR}`);
    const modFiles = readdirSync(LOCAL_MODS_DIR).filter((f) => f.endsWith(".jar"));
    for (const file of modFiles) {
      if (checkExistingFile(file, false)) {
        log("cyan", `  \u2139 ${file} already exists, skipping`);
      } else {
        copyFileSync(join(LOCAL_MODS_DIR, file), join(MODS_DIR, file));
        log("green", `  \u2713 Copied ${file}`);
        localCopyCount++;
      }
    }
  } else {
    log("yellow", `  \u26A0 Local mods directory not found: ${LOCAL_MODS_DIR}`);
  }
  console.log();
  if (existsSync(LOCAL_SHADERS_DIR)) {
    log("cyan", `Checking local shaders directory: ${LOCAL_SHADERS_DIR}`);
    const shaderFiles = readdirSync(LOCAL_SHADERS_DIR);
    for (const file of shaderFiles) {
      if (checkExistingFile(file, true)) {
        log("cyan", `  \u2139 ${file} already exists, skipping`);
      } else {
        copyFileSync(join(LOCAL_SHADERS_DIR, file), join(SHADERPACKS_DIR, file));
        log("green", `  \u2713 Copied ${file}`);
        localCopyCount++;
      }
    }
  } else {
    log("yellow", `  \u26A0 Local shaderpacks directory not found: ${LOCAL_SHADERS_DIR}`);
  }
  console.log();
  log("cyan", `Copied ${localCopyCount} file(s) from local directories`);
  console.log();
  log("green", "[5/5] Downloading missing mods...");
  console.log();
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  for (const mod of MODS) {
    const existingMod = findExistingMod(mod.slug, MODS_DIR);
    if (existingMod) {
      log("cyan", `${mod.name} already installed: ${existingMod}`);
      skipCount++;
    } else {
      const success = await downloadMod(mod.slug, mod.name, false, mcVersion);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    await Bun.sleep(500);
  }
  console.log();
  const existingShader = findExistingShader("complementary");
  if (existingShader) {
    log("cyan", `Complementary Reimagined already installed: ${existingShader}`);
    skipCount++;
  } else {
    const success = await downloadMod("complementary-reimagined", "Complementary Reimagined", true, mcVersion);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  console.log();
  log("blue", "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  log("blue", "\u2551           Installation Summary         \u2551");
  log("blue", "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log();
  log("green", `\u2713 Copied from local: ${localCopyCount}`);
  log("green", `\u2713 Downloaded: ${successCount}`);
  log("cyan", `\u2139 Already installed: ${skipCount}`);
  log("yellow", `\u26A0 Not available for ${mcVersion}: ${failCount}`);
  console.log();
  const totalInstalled = localCopyCount + successCount + skipCount;
  if (failCount === 0) {
    log("green", `\uD83C\uDF89 All ${totalInstalled} mods and shaders are ready!`);
  } else if (successCount > 0 || localCopyCount > 0) {
    log("yellow", `\u26A0 ${totalInstalled} mods installed, but ${failCount} are not yet available for Minecraft ${mcVersion}.`);
    log("yellow", "   Check back later at https://modrinth.com");
  } else {
    log("red", `\u26A0 No mods could be downloaded for Minecraft ${mcVersion}.`);
    log("yellow", "   Most mods may not be updated yet. You can:");
    log("yellow", `   1. Wait for mod developers to release ${mcVersion} versions`);
    log("yellow", "   2. Check manually at https://modrinth.com");
  }
  console.log();
  log("blue", "Next steps:");
  console.log("1. Launch Minecraft");
  console.log("2. Select the Fabric profile (should be auto-created)");
  console.log("3. Only the compatible mods will load");
  console.log();
  log("cyan", "Tip: Keep your local minecraft/mods folder updated for easy reinstalls!");
  console.log();
}
main().catch((error) => {
  log("red", `Fatal error: ${error}`);
  process.exit(1);
});
