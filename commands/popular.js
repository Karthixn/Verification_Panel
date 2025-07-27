const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRows } = require('../utils/sheetUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('popular')
    .setDescription('🔥 Show most popular payment items/packages'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const data = await getRows("Sheet1!A2:G"); // Skip header
      const itemCounts = {};

      for (const row of data) {
        if (row.length < 5) continue; // Ensure Item column exists
        const item = row[4]?.trim() || 'Unknown';
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      }

      const sorted = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([item, count], i) => `#${i + 1} **${item}** — ${count} purchases`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('🏆 Most Popular Items')
        .setDescription(sorted || 'No data available.')
        .setColor('#fdcb6e')
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Error fetching popular items.');
    }
  }
};
