#  Verification Bot

This Discord bot handles user verification for the Origin_Roleplay server using an embedded verification panel and button.

## Features

- `/verify-panel` command sends an embed with a "Verify Yourself" button.
- When clicked:
  - Grants a verified role
  - Sends an ephemeral confirmation message
  - Sends a DM with a verification success message
  - Logs the verification to a designated channel

## Setup Instructions

1. Clone or download the bot project.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file and configure the following:

```
BOT_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_guild_id
VERIFIED_ROLE_ID=role_id_to_assign
LOG_CHANNEL_ID=log_channel_id
VERIFY_GIF=https://link.to/your/thumbnail.gif
```

4. Deploy slash commands:

```bash
node deploy-commands.js
```

5. Run the bot:

```bash
node index.js
```

6. Use `/verify-panel` in your desired verification channel to post the panel.

## Notes

- Ensure the bot has permissions to manage roles, send DMs, and send messages in the verification and log channels.
- Modify the verification embed and messages to suit your branding.

---

Made for Origin_Roleplay by request.
