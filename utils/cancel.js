const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');

const LOG_CHANNEL_ID = process.env.PAY_LOG_CHANNEL_ID || '1372966287822557356';

async function handleCancel(interaction, message, amount, item, user, seller) {
  const disabled = new ActionRowBuilder().addComponents(
    ButtonBuilder.from(message.components[0].components[0]).setDisabled(true),
    ButtonBuilder.from(message.components[0].components[1]).setDisabled(true)
  );

  await interaction.update({ content: '❌ Payment cancelled.', embeds: [], components: [disabled] });

  const cancelEmbed = new EmbedBuilder()
    .setTitle('❌ Payment Cancelled')
    .setColor('#e74c3c')
    .addFields(
      { name: 'User', value: seller.tag, inline: true },
      { name: 'Amount', value: `₹${amount}`, inline: true },
      { name: 'Item', value: item, inline: true }
    )
    .setTimestamp();

  const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (logChannel) await logChannel.send({ embeds: [cancelEmbed] });
}

module.exports = { handleCancel };
