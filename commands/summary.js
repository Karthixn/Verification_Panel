const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRows } = require('../utils/sheetUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('📊 Show total income from all payments'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const data = await getRows('Sheet1!A2:G'); // skip header

      let total = 0;

      for (const row of data) {
        const rawAmount = row[3]?.toString().replace(/[₹, ]/g, '');
        const amount = parseFloat(rawAmount);
        const status = row[5]?.trim();

        if (isNaN(amount)) continue;
        if (status !== 'Confirmed') continue;

        total += amount;
      }

      const embed = new EmbedBuilder()
        .setTitle('💰 Total Income Summary')
        .setDescription(`Total income from all time: ₹${total.toFixed(2)}`)
        .setColor('#00b894')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Error fetching summary data.');
    }
  }
};
