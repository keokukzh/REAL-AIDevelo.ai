# AIDevelo.ai User Guide

Welcome to AIDevelo.ai! This guide will help you set up and use your AI voice agent.

## Getting Started

### 1. Account Setup

1. Visit [aidevelo.ai](https://aidevelo.ai) and sign up
2. Complete the onboarding wizard:
   - Select your business persona
   - Enter business information
   - Configure services
   - Set goals for your agent

### 2. Dashboard Overview

After onboarding, you'll see the main dashboard with:

- **Status Cards**: Quick overview of Agent, Phone, Calendar, and Calls status
- **Quick Actions**: Buttons to connect phone, calendar, test agent, and view calls
- **Recent Calls**: Table showing your latest calls
- **Activity Chart**: Visual representation of call volume

## Connecting Your Phone Number

1. Click **"Telefon verbinden"** (Connect Phone) in Quick Actions
2. Select an available phone number from the list
3. Click **"Nummer zuweisen"** (Assign Number)
4. The system will automatically configure webhooks

**Note**: Make sure `PUBLIC_BASE_URL` is configured in your backend environment for webhooks to work.

## Connecting Google Calendar

1. Click **"Kalender verbinden"** (Connect Calendar) in Quick Actions
2. A popup window will open for Google OAuth
3. Sign in with your Google account and grant permissions
4. The window will close automatically when connected

**Disconnecting**: Click the disconnect button (X) next to the connected status.

## Testing Your Agent

1. Click **"Agent testen"** (Test Agent) button
2. Enter a test phone number (E.164 format, e.g., +41791234567)
3. Click **"Anrufen"** (Call) to initiate a test call
4. The call status will be displayed in real-time

**Browser Test**: You can also test the agent directly in the browser using the streaming interface.

## Managing Knowledge Base (RAG)

### Uploading Documents

1. Navigate to **Knowledge Base** from the sidebar
2. Click **"Upload Document"**
3. Drag & drop or select a file (.txt, .md, .pdf)
4. Optionally enter a document title
5. Click **"Upload Document"**

Documents are automatically processed, chunked, and embedded into the vector database.

### Viewing Documents

- All uploaded documents are listed in the Knowledge Base page
- Click the **eye icon** to preview document content
- Status indicators show processing state (uploaded, embedded, error)

### Deleting Documents

1. Click the **trash icon** next to a document
2. Confirm deletion
3. The document and all its chunks will be removed

## Viewing Call Logs

1. Click **"Calls ansehen"** (View Calls) or navigate to **Calls** from the sidebar
2. Use filters to search by:
   - Date range
   - Call direction (inbound/outbound)
   - Status
   - Call SID or phone number
3. Click on any call to view detailed information

### Call Details

The call details modal shows:
- Call SID and status
- Phone numbers (from/to)
- Timestamps and duration
- Transcript (if available)
- Recording URL (if available)
- RAG stats (if RAG was used during the call)

## Troubleshooting

### Phone Not Connecting

- Verify `PUBLIC_BASE_URL` is set correctly in backend
- Check webhook status using **"Webhook Status prüfen"** button
- Ensure Twilio account has sufficient credits

### Calendar Not Connecting

- Verify `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set
- Check that OAuth redirect URI matches your backend URL
- Try disconnecting and reconnecting

### Agent Not Responding

- Verify ElevenLabs Agent ID is configured in agent settings
- Check that phone number is connected
- Review call logs for error messages

### Documents Not Embedding

- Check that Qdrant is accessible and configured
- Verify `OPENAI_API_KEY` is set for embeddings
- Review document status in Knowledge Base page

## Support

For additional help:
- Check the [API Documentation](../server/API_DOCUMENTATION.md)
- Review [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Contact support at support@aidevelo.ai
