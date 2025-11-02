# Migration to TypeScript/Bun Version

## Why We Migrated

The original bash script (`fabric_helper.sh`) was macOS/Linux only. The new TypeScript/Bun version (`index.ts`) provides:

### ✅ Cross-Platform Support

- **Windows** - Full native support (no WSL/Git Bash needed)
- **macOS** - Full support (as before)
- **Linux** - Full support (as before)

### ✅ Better Developer Experience

- **TypeScript** - Type safety and better IDE support
- **Modern APIs** - Native fetch, built-in path handling
- **No external dependencies** - No need for `curl` or `jq`
- **Faster** - Bun is significantly faster than bash

### ✅ Easier Maintenance

- **Single codebase** - One script for all platforms
- **Better error handling** - Try/catch and proper error messages
- **Cleaner code** - Async/await instead of shell pipes

## Platform-Specific Differences

### Minecraft Directory Detection

**Bash version (macOS only):**

```bash
MINECRAFT_DIR="$HOME/Library/Application Support/minecraft"
```

**TypeScript/Bun version (cross-platform):**

```typescript
function getMinecraftDir(): string {
  const platform = process.platform;
  
  if (platform === "darwin") {
    return join(homedir(), "Library/Application Support/minecraft");
  }
  if (platform === "win32") {
    const appData = process.env.APPDATA;
    return join(appData, ".minecraft");
  }
  // Linux
  return join(homedir(), ".minecraft");
}
```

### HTTP Requests

**Bash version:**

```bash
curl -s -A "$USER_AGENT" "$API_URL"
```

**TypeScript/Bun version:**

```typescript
const response = await fetch(apiUrl, {
  headers: { "User-Agent": USER_AGENT }
});
const data = await response.json();
```

### JSON Parsing

**Bash version (requires `jq`):**

```bash
echo "$VERSIONS" | jq -r '.[0].files[0].url'
```

**TypeScript/Bun version (built-in):**

```typescript
const versions = await response.json() as ModrinthVersion[];
const url = versions[0]?.files[0]?.url;
```

## Features Comparison

| Feature | Bash | TypeScript/Bun |
|---------|------|----------------|
| Windows Support | ❌ | ✅ |
| macOS Support | ✅ | ✅ |
| Linux Support | ✅ | ✅ |
| External Dependencies | curl, jq | None (Bun only) |
| Type Safety | ❌ | ✅ TypeScript |
| Async Operations | Limited | Native async/await |
| Error Handling | Basic | Advanced try/catch |
| Code Maintainability | Moderate | High |
| Performance | Good | Excellent |

## Should You Switch?

### Use TypeScript/Bun version if

- ✅ You want Windows support
- ✅ You want better error messages
- ✅ You prefer modern JavaScript/TypeScript
- ✅ You want faster execution
- ✅ You don't want to install `jq`

### Keep using Bash version if

- ✅ You're comfortable with bash scripts
- ✅ You only use macOS/Linux
- ✅ You prefer not to install Bun
- ✅ You want a zero-dependency script (except curl/jq)

## Installation Comparison

### Bash Version

```bash
# Requires: curl, jq, Java
chmod +x fabric_helper.sh
./fabric_helper.sh
```

### TypeScript/Bun Version

```bash
# Requires: Bun, Java
bun install
bun run start
```

## Both Versions Are Maintained

We're keeping both versions for flexibility:

- **`index.ts`** - Modern, cross-platform (recommended)
- **`fabric_helper.sh`** - Traditional, Unix-only

Choose the one that fits your needs!
