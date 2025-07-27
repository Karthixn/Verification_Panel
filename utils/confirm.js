const { EmbedBuilder } = require('discord.js');
const { generateInvoiceNumber } = require('./generateInvoiceNumber');
const logPayment = require('./logToSheet');

const INVOICE_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1338958667411624058/1364074215162122361/ChatGPT_Image_Apr_22_2025_08_33_48_AM.png';
const LOG_CHANNEL_ID = process.env.PAY_LOG_CHANNEL_ID || '1372966287822557356';

async function handleConfirm(interaction, message, amount, item, user, seller) {
  const invoiceId = generateInvoiceNumber(item);
  const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

  // Delete original payment request message
  if (message.deletable) await message.delete().catch(() => {});

  const confirmEmbed = new EmbedBuilder()
    .setTitle('✅ Payment Confirmed')
    .setColor('#2ecc71')
    .setDescription(`**Transaction ID:** ${invoiceId}\n**Amount:** ₹${amount}\n**Item:** ${item}`)
    .setTimestamp();

  const invoiceEmbed = new EmbedBuilder()
    .setTitle('🧾 Invoice')
    .setColor('#f1c40f')
    .setImage(INVOICE_IMAGE_URL)
    .addFields(
      { name: 'Invoice Number', value: invoiceId, inline: true },
      { name: 'Seller', value: seller.tag, inline: true },
      { name: 'Amount', value: `₹${amount}`, inline: true },
      { name: 'Item', value: item, inline: true },
      { name: 'Status', value: 'Paid ✅', inline: true }
    )
    .setFooter({ text: 'Thank you!' })
    .setTimestamp();

  const logEmbed = new EmbedBuilder()
    .setTitle('💸 Payment Log')
    .setColor('#3498db')
    .addFields(
      { name: 'User', value: seller.tag, inline: true },
      { name: 'Action', value: 'Confirmed', inline: true },
      { name: 'Txn ID', value: invoiceId, inline: false }
    )
    .setTimestamp();

  await interaction.followUp({ embeds: [confirmEmbed, invoiceEmbed] });
  if (logChannel) await logChannel.send({ embeds: [logEmbed] });

  // Log to Google Sheets
  await logPayment({
    invoiceId,
    seller: seller.tag,
    client: user.tag,
    amount: `₹${amount}`,
    item,
    status: 'Confirmed',
    timestamp: new Date().toISOString(),
  });
}

module.exports = { handleConfirm };
