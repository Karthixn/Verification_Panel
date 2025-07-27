const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-panel')
    .setDescription('Sends the verification panel.'),

  async execute(interaction) {
    const verifyEmbed = new EmbedBuilder()
      .setColor('#00b0f4')
      .setTitle('✅ Origin Roleplay Verification')
      .setDescription('Click the button below to verify yourself and gain access to the server.')
      .setThumbnail(process.env.VERIFY_GIF || 'https://media.giphy.com/media/l0Exk8EUzSLsrErEQ/giphy.gif')
      .setFooter({ text: 'Origin Roleplay' });

    const verifyButton = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('Verify Yourself')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(verifyButton);

    await interaction.reply({
      embeds: [verifyEmbed],
      components: [row],
    });
  },
};
