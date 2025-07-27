require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();
const prefix = process.env.PREFIX || '!';

// Webhook error logging
const sentErrors = new Set();
const sendToWebhook = async (content, type = 'ERROR', context = {}) => {
  const webhook = process.env.ERROR_WEBHOOK_URL;
  if (!webhook) return;

  const hash = content.slice(0, 400);
  if (sentErrors.has(hash)) return;
  sentErrors.add(hash);
  setTimeout(() => sentErrors.delete(hash), 10000);

  const colorMap = {
    ERROR: 0xe74c3c,
    WARN: 0xf1c40f,
    LOG: 0x2ecc71,
  };

  const fields = [{
    name: '\u200b',
    value: `\`\`\`js\n${content.slice(0, 1000)}\n\`\`\``,
  }];

  if (context.guildName) fields.unshift({ name: 'Guild', value: context.guildName, inline: true });
  if (context.commandName) fields.unshift({ name: 'Command', value: context.commandName, inline: true });

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `${type} Log`,
          color: colorMap[type] || 0x95a5a6,
          timestamp: new Date().toISOString(),
          fields,
          footer: {
            text: `${process.env.BOT_NAME || 'Bot'} • ${process.env.ENVIRONMENT || 'Dev'}`,
            icon_url: process.env.BOT_ICON || null,
          },
        }],
      }),
    });
  } catch (err) {
    console.error('Failed to send error to webhook:', err);
  }
};

// Patch console
['log', 'warn', 'error'].forEach(method => {
  const original = console[method];
  console[method] = (...args) => {
    const content = args.map(a =>
      a instanceof Error ? a.stack :
      typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    ).join(' ');
    sendToWebhook(content, method.toUpperCase());
    original.apply(console, args);
  };
});

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js') && file !== 'welcome.js');

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));

  if ('data' in command && 'execute' in command) {
    // Slash command
    client.commands.set(command.data.name, command);
  } else if ('name' in command && 'execute' in command) {
    // Prefix command
    client.commands.set(command.name, command);
  } else {
    console.warn(`[WARNING] The command at ${file} is missing "data/name" or "execute".`);
  }
}

// Welcome handler
const welcomeHandler = require(path.join(commandsPath, 'welcome.js'));

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const statuses = [
    { name: 'Origin City', type: 0 },     // Playing
    { name: 'Origin Roleplay', type: 3 },       // Watching
    { name: 'Made by Spidey', type: 2 }         // Listening
  ];

  let index = 0;

  setInterval(() => {
    client.user.setActivity(statuses[index]);
    index = (index + 1) % statuses.length;
  }, 15000); // 15 seconds
});



// Slash command handling
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[WARN] Slash command "${interaction.commandName}" not found.`);
    return;
  }

  console.log(`⚡ Slash command triggered: /${interaction.commandName} by ${interaction.user.tag}`);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Error executing slash command "${interaction.commandName}"`, error);
    sendToWebhook(error.stack || error.message, 'ERROR', {
      guildName: interaction.guild?.name || 'DM',
      commandName: interaction.commandName,
    });

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ There was an error executing that command.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ There was an error executing that command.', ephemeral: true });
      }
    } catch {}
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'verify_button') {
    const verifiedRole = interaction.guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
    const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);

    if (!verifiedRole || !logChannel) {
      return interaction.reply({ content: '❌ Configuration error. Please contact staff.', ephemeral: true });
    }

    try {
      // Add verified role
      await interaction.member.roles.add(verifiedRole);

      // Ephemeral confirmation
      await interaction.reply({
        content: '✅ You have been verified! Welcome to Origin Roleplay.',
        ephemeral: true,
      });

      // DM embed
      const dmEmbed = {
        color: 0x00b0f4,
        title: '✅ You are Verified!',
        description: 'Thanks for verifying. You now have full access to the Origin Roleplay server!',
        footer: { text: 'Enjoy your stay!' },
      };

      await interaction.user.send({ embeds: [dmEmbed] }).catch(() => {
        console.warn('⚠️ Could not DM user.');
      });

      // Log to staff/log channel
      await logChannel.send({
        embeds: [{
          color: 0x2ecc71,
          title: '🛡️ New Verification',
          description: `${interaction.user.tag} (${interaction.user.id}) verified.`,
          timestamp: new Date().toISOString(),
        }]
      });

    } catch (error) {
      console.error('❌ Verification failed:', error);
      await interaction.reply({ content: '❌ Something went wrong verifying you.', ephemeral: true });
    }
  }
});


// Prefix command handling
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command || typeof command.execute !== 'function') return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`❌ Error executing prefix command "${commandName}"`, error);
    sendToWebhook(error.stack || error.message, 'ERROR', {
      guildName: message.guild?.name || 'DM',
      commandName,
    });
    await message.reply("❌ There was an error executing that command.");
  }
});

const logHandler = require('./commands/log.js');
client.once('ready', () => {
  logHandler.execute(client);
});


// Welcome event
client.on('guildMemberAdd', async member => {
  try {
    await welcomeHandler(member, client);
  } catch (error) {
    console.error('❌ Error running welcome handler:', error);
    sendToWebhook(error.stack || error.message, 'ERROR', {
      guildName: member.guild?.name || 'Unknown Guild',
      commandName: 'guildMemberAdd / welcome',
    });
  }
});

// Crash handlers
process.on('unhandledRejection', reason => {
  const msg = reason?.stack || String(reason);
  console.error('UNHANDLED REJECTION:', msg);
  sendToWebhook(msg, 'ERROR');
});

process.on('uncaughtException', err => {
  const msg = err?.stack || String(err);
  console.error('UNCAUGHT EXCEPTION:', msg);
  sendToWebhook(msg, 'ERROR');
});

client.login(process.env.BOT_TOKEN);
