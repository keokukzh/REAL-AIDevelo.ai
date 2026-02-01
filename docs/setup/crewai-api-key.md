# How to Set CrewAI LLM API Key

The CrewAI service needs an API key to generate content. You can use either OpenAI or Anthropic.

## Option 1: Using OpenAI (Recommended)

### Step 1: Get your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-...`)

### Step 2: Add to Environment Variables

**For Docker Compose (Recommended):**

Create or edit `.env` file in the **root directory** of the project:

```bash
# Add this line (replace with your actual key)
OPENAI_API_KEY=sk-your-actual-api-key-here

# Or use the CrewAI-specific variable
CREWAI_LLM_API_KEY=sk-your-actual-api-key-here
```

**For Local Development:**

If running the service locally (not in Docker), add to `server/.env`:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Restart the Service

After adding the API key, restart the CrewAI service:

```bash
docker-compose restart crewai-service
```

Or if starting fresh:

```bash
docker-compose up -d crewai-service
```

## Option 2: Using Anthropic Claude

If you prefer to use Anthropic's Claude:

1. Get your API key from https://console.anthropic.com/
2. Add to `.env` file:

```bash
CREWAI_LLM_PROVIDER=anthropic
CREWAI_LLM_API_KEY=sk-ant-your-actual-api-key-here
```

3. Restart the service

## Verify It's Working

Test the service:

```bash
# Check health
curl http://localhost:8004/health

# Or in PowerShell:
Invoke-WebRequest -Uri http://localhost:8004/health -UseBasicParsing
```

You should see:
```json
{
  "status": "healthy",
  "service": "crewai-service",
  "llm_provider": "openai",
  "llm_model": "gpt-4o"
}
```

## Quick Setup Script

Run this in PowerShell from the project root:

```powershell
# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    New-Item -Path ".env" -ItemType File
}

# Add OpenAI API key (replace YOUR_KEY_HERE with your actual key)
Add-Content -Path ".env" -Value "OPENAI_API_KEY=YOUR_KEY_HERE"

# Restart the service
docker-compose restart crewai-service
```

## Important Notes

- **Never commit `.env` files to git** - they contain secrets!
- The `.env` file should be in the **root directory** (same level as `docker-compose.yml`)
- Docker Compose automatically reads `.env` from the root directory
- You can use either `OPENAI_API_KEY` or `CREWAI_LLM_API_KEY` - both work
- If both are set, `CREWAI_LLM_API_KEY` takes priority
