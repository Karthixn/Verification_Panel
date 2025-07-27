const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRows } = require('../utils/sheetUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('📜 Show payment history of a specific client')
    .addStringOption(option =>
      option.setName('client')
        .setDescription('Client name or ID')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    const clientName = interaction.options.getString('client').toLowerCase();

    try {
      // Adjust range to your actual sheet name and columns (A:G)
      const rows = await getRows('Sheet1!A:G');

      // Filter rows (skip header)
      const filtered = rows.filter((row, i) => {
        if (i === 0) return false; // skip header
        return row[2]?.toLowerCase().includes(clientName); // client is column C (index 2)
      });

      if (!filtered.length) {
        return await interaction.editReply('❌ No transactions found for this client.');
      }

      // Limit to 10 results
      const displayRows = filtered.slice(0, 10);

      const history = displayRows
        .map(row => {
          const invoice = row[0];
          const seller = row[1];
          const client = row[2];
          const amount = row[3];
          const item = row[4] || 'No item';
          const status = row[5];
          const timestamp = row[6] ? new Date(row[6]).toLocaleString() : 'No date';

          return `🧾 **${invoice}** | Seller: **${seller}** → Client: **${client}** | Amount: **${amount}** | Item: **${item}** | Status: **${status}** | Date: **${timestamp}**`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`📋 Payment History for "${clientName}"`)
        .setDescription(history)
        .setColor('#0984e3')
        .setTimestamp();

      if (filtered.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${filtered.length} results` });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ Error fetching payment history.');
    }
  }
};
