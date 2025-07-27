const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'welcomeConfig.json');

// Helper: load config JSON or create empty if missing
function loadConfig() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '{}', 'utf-8');
    return {};
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// Helper: save config JSON
function saveConfig(config) {
  fs.writeFileSync(dataPath, JSON.stringify(config, null, 2), 'utf-8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcomeconfig')
    .setDescription('Manage the welcome channel and role configuration')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set the welcome channel and role')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel where welcome messages will be sent')
            .setRequired(true)
            .addChannelTypes(0) // Only text channels
        )
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Role to assign to new members')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View current welcome channel and role configuration')
    )

    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove the welcome channel and role configuration')
    ),

  async execute(interaction) {
    const config = loadConfig();
    const guildId = interaction.guildId;

    if (interaction.options.getSubcommand() === 'set') {
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');

      // Save config for this guild
      config[guildId] = {
        channelId: channel.id,
        roleId: role.id,
      };
      saveConfig(config);

      const embed = new EmbedBuilder()
        .setTitle('✅ Welcome Configuration Set')
        .setColor('Green')
        .addFields(
          { name: 'Welcome Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Welcome Role', value: `<@&${role.id}>`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (interaction.options.getSubcommand() === 'view') {
      const guildConfig = config[guildId];
      if (!guildConfig) {
        return interaction.reply({ content: '❌ No welcome configuration found for this server.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('ℹ️ Welcome Configuration')
        .setColor('Blue')
        .addFields(
          { name: 'Welcome Channel', value: `<#${guildConfig.channelId}>`, inline: true },
          { name: 'Welcome Role', value: `<@&${guildConfig.roleId}>`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (interaction.options.getSubcommand() === 'remove') {
      if (config[guildId]) {
        delete config[guildId];
        saveConfig(config);
        await interaction.reply({ content: '✅ Welcome configuration removed.', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ No welcome configuration to remove.', ephemeral: true });
      }
    }
  }
};
