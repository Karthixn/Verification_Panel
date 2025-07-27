const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!BOT_TOKEN || !CLIENT_ID) {
  console.error('❌ Missing required environment variables: BOT_TOKEN or CLIENT_ID');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file =>
  file.endsWith('.js') &&
  file !== 'welcome.js'
);

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`[WARNING] Skipping ${file}: missing "data" or "execute".`);
  }
}

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
  try {
    console.log(`🔄 Refreshing ${commands.length} slash command(s)...`);

    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands },
      );
      console.log('✅ Successfully registered commands for guild.');
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands },
      );
      console.log('✅ Successfully registered global commands (may take up to 1 hour).');
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
})();
