# Quick Start: ElevenLabs MCP Setup

## Method 1: Automatic Setup (Easiest)

1. **Set your API key:**
   ```bash
   # Windows PowerShell
   $env:ELEVENLABS_API_KEY="your_key_here"
   
   # Windows CMD
   set ELEVENLABS_API_KEY=your_key_here
   
   # macOS/Linux
   export ELEVENLABS_API_KEY=your_key_here
   ```

2. **Run the setup script:**
   ```bash
   npm run mcp:setup
   ```

3. **Restart Cursor** - Done! ✅

## Method 2: Manual Setup

### 1. Get Your API Key

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/settings/api-keys)
2. Copy your API key (starts with `sk_`)

### 2. Configure in Cursor

1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "MCP" or go to **Features** → **Model Context Protocol**
3. Add this configuration:

```json
{
  "mcpServers": {
    "elevenlabs": {
      "description": "Official ElevenLabs MCP for text-to-speech, voice cloning, audio processing, and transcription.",
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "YOUR_API_KEY_HERE",
        "ELEVENLABS_MCP_BASE_PATH": "~/Desktop",
        "ELEVENLABS_MCP_OUTPUT_MODE": "files"
      }
    }
  }
}
```

4. Replace `YOUR_API_KEY_HERE` with your actual API key
5. Save and restart Cursor

## 3. Verify

Ask Cursor AI: "List my ElevenLabs agents"

If it works, you'll see your agents listed!

## Troubleshooting

- **Not working?** Check that Python and `uv` are installed
- **API key error?** Verify the key is correct in ElevenLabs dashboard
- **Need help?** See [ELEVENLABS_MCP_SETUP.md](./ELEVENLABS_MCP_SETUP.md) for detailed instructions
