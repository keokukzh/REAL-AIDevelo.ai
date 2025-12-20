# ElevenLabs MCP (Model Context Protocol) Setup

## Overview

This guide explains how to configure the ElevenLabs MCP server in Cursor to enable direct integration with ElevenLabs services for voice generation, agent management, and audio processing.

## What is MCP?

Model Context Protocol (MCP) is a standardized protocol that allows AI assistants (like Cursor's AI) to interact with external services and tools. The ElevenLabs MCP server provides access to:

- Text-to-speech generation
- Voice cloning
- Audio processing
- Transcription
- Conversational AI agent management
- Sound effects generation

## Configuration

### Step 1: Open Cursor Settings

1. Open Cursor
2. Go to **Settings** (or press `Ctrl+,` / `Cmd+,`)
3. Navigate to **Features** → **Model Context Protocol** (or search for "MCP")

### Step 2: Add ElevenLabs MCP Server

Add the following configuration to your MCP servers:

```json
{
  "mcpServers": {
    "elevenlabs": {
      "description": "Official ElevenLabs MCP for text-to-speech, voice cloning, audio processing, and transcription. Generate AI voices, design custom voices, isolate audio, create sound effects, and more.",
      "command": "uvx",
      "args": [
        "elevenlabs-mcp"
      ],
      "env": {
        "ELEVENLABS_API_KEY": "<your-api-key>",
        "ELEVENLABS_MCP_BASE_PATH": "~/Desktop",
        "ELEVENLABS_MCP_OUTPUT_MODE": "files"
      }
    }
  }
}
```

### Step 3: Set Your API Key

Replace `<your-api-key>` with your actual ElevenLabs API key:

1. Get your API key from [ElevenLabs Dashboard](https://elevenlabs.io/app/settings/api-keys)
2. Copy the API key
3. Replace `<your-api-key>` in the configuration above

**Important:** Never commit your API key to version control. The API key should only be in your local Cursor settings.

### Step 4: Configure Base Path (Optional)

The `ELEVENLABS_MCP_BASE_PATH` setting determines where generated files are saved:

- **Default:** `~/Desktop` (your Desktop folder)
- **Windows:** `C:\Users\YourUsername\Desktop`
- **macOS/Linux:** `~/Desktop`

You can change this to any directory you prefer, for example:
- `~/Documents/ElevenLabs`
- `C:\Users\YourUsername\Documents\ElevenLabs`
- `/home/username/elevenlabs-output`

### Step 5: Configure Output Mode

The `ELEVENLABS_MCP_OUTPUT_MODE` setting controls how output is handled:

- **`files`** (recommended): Saves generated audio files to disk
- Other modes may be available depending on the MCP server version

### Step 6: Restart Cursor

After adding the configuration:

1. Save the settings
2. Restart Cursor to load the MCP server
3. The ElevenLabs MCP server should now be available

## Verification

To verify the MCP server is working:

1. Open a chat with Cursor AI
2. Ask: "List my ElevenLabs agents"
3. The AI should be able to access your ElevenLabs account and list your agents

## Using MCP in Development

Once configured, you can use MCP commands in your conversations with Cursor AI:

- **Generate voice:** "Generate a voice saying 'Hello, welcome to AIDevelo'"
- **List agents:** "List all my ElevenLabs conversational AI agents"
- **Create agent:** "Create a new ElevenLabs agent for customer service"
- **Process audio:** "Isolate vocals from this audio file"

## Environment Variables Reference

### Required

- **`ELEVENLABS_API_KEY`**: Your ElevenLabs API key
  - Get it from: https://elevenlabs.io/app/settings/api-keys
  - Format: `sk_...` (starts with `sk_`)

### Optional

- **`ELEVENLABS_MCP_BASE_PATH`**: Directory for output files
  - Default: `~/Desktop`
  - Can be any valid directory path

- **`ELEVENLABS_MCP_OUTPUT_MODE`**: Output handling mode
  - Default: `files`
  - Options: `files` (saves to disk)

## Security Best Practices

1. **Never commit API keys:**
   - MCP configuration is stored in Cursor settings (not in the project)
   - Never add API keys to `.env` files that are committed to git
   - Use environment variables in production (Render, etc.)

2. **Use different keys for dev/prod:**
   - Development: Use a test API key in Cursor MCP settings
   - Production: Use production API key in Render environment variables

3. **Rotate keys regularly:**
   - Change API keys periodically
   - Revoke old keys when creating new ones

## Troubleshooting

### MCP Server Not Loading

1. **Check Python/uvx installation:**
   - MCP uses `uvx` which requires Python
   - Install Python if not already installed
   - Install uv: `pip install uv` or `pipx install uv`

2. **Check API key:**
   - Verify the API key is correct
   - Test the API key at https://elevenlabs.io/app/settings/api-keys

3. **Check Cursor logs:**
   - Open Cursor → Help → Toggle Developer Tools
   - Check Console for MCP-related errors

### API Key Not Working

1. **Verify key format:**
   - Should start with `sk_`
   - Should be the full key (not truncated)

2. **Check key permissions:**
   - Ensure the key has necessary permissions
   - Some features may require specific permissions

3. **Test key directly:**
   - Use the API key in a test script to verify it works
   - See `server/scripts/testElevenLabs.ts` for examples

### Files Not Saving

1. **Check base path:**
   - Ensure the path exists and is writable
   - Use absolute paths for reliability

2. **Check permissions:**
   - Ensure you have write permissions to the directory
   - On Windows, check folder permissions

## Integration with Project

The MCP server is separate from the project's backend integration:

- **MCP (Cursor):** For AI assistant interactions (development)
- **Backend API:** For production voice calls and agent management

Both use the same ElevenLabs API, but serve different purposes:
- MCP helps with development and testing
- Backend API handles production calls and webhooks

## Related Documentation

- [ElevenLabs Agent ID Setup](./ELEVENLABS_AGENT_ID_SETUP.md)
- [Environment Variables](./INTEGRATION_ENV_VARS.md)
- [Production Deployment](./RENDER_DEPLOYMENT.md)

## Additional Resources

- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [ElevenLabs MCP Server](https://github.com/elevenlabs/elevenlabs-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
