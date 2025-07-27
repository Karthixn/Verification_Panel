const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');
require('dotenv').config();

const logPayment = require('../utils/logToSheet');

const QR_IMAGE_URL = 'https://cdn.discordapp.com/icons/1381310270869082162/1ef298e0129ed4d3106283c63eade7e6.png?size=512';
const INVOICE_IMAGE_URL = 'https://cdn.discordapp.com/icons/1381310270869082162/1ef298e0129ed4d3106283c63eade7e6.png?size=512';
const LOG_CHANNEL_ID = process.env.PAY_LOG_CHANNEL_ID || '1393667103911055371';

function generateInvoiceNumber(itemName) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const short = itemName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'XXX';
  return `bs${y}${m}${d}${short}${now.getSeconds()}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Send a payment request with QR code')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to pay').setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount').setDescription('Payment amount in ₹').setRequired(true))
    .addStringOption(option =>
      option.setName('item').setDescription('Item being paid for').setRequired(true)),

  async execute(interaction) {
    console.log('[DEBUG] /pay command triggered');

    try {
      await interaction.deferReply({ ephemeral: false }); // ✅ Prevent "application did not respond"

      const user = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const item = interaction.options.getString('item');
      const expiresAt = Date.now() + 15 * 60 * 1000;
      console.log(`[DEBUG] Inputs: user=${user.tag}, amount=₹${amount}, item=${item}`);

      const embed = new EmbedBuilder()
        .setAuthor({ name: `${interaction.user.tag} requests payment`, iconURL: interaction.user.displayAvatarURL() })
        .setTitle(`Payment Request to ${user.tag}`)
        .setDescription(`Click **Confirm** to proceed or **Cancel**.`)
        .addFields(
          { name: 'Amount', value: `₹${amount}`, inline: true },
          { name: 'Item', value: item, inline: true },
          { name: 'Client', value: user.tag, inline: true }
        )
        .setImage(QR_IMAGE_URL)
        .setColor('#3498db')
        .setFooter({ text: `Expires <t:${Math.floor(expiresAt / 1000)}:R>` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pay_confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('pay_cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
      const message = await interaction.fetchReply();
      console.log('[DEBUG] Embed sent and message fetched');

      const filter = i =>
        ['pay_confirm', 'pay_cancel'].includes(i.customId) && i.user.id === interaction.user.id;

      const collector = message.createMessageComponentCollector({ filter, time: 15 * 60 * 1000 });
      console.log('[DEBUG] Collector started');

      collector.on('collect', async i => {
        console.log(`[DEBUG] Collected: ${i.customId}`);

        const disabled = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(row.components[0]).setDisabled(true),
          ButtonBuilder.from(row.components[1]).setDisabled(true)
        );

        const invoiceId = generateInvoiceNumber(item);
        const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(err => {
          console.warn('[WARN] Log channel fetch failed:', err.message);
          return null;
        });

        if (i.customId === 'pay_confirm') {
          await i.deferUpdate();
          if (message.deletable) await message.delete().catch(() => {});
          console.log('[DEBUG] Confirmed & deleted message');

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
              { name: 'Seller', value: interaction.user.tag, inline: true },
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
              { name: 'User', value: interaction.user.tag, inline: true },
              { name: 'Action', value: 'Confirmed', inline: true },
              { name: 'Txn ID', value: invoiceId, inline: false }
            )
            .setTimestamp();

          await interaction.followUp({ embeds: [confirmEmbed, invoiceEmbed] });
          if (logChannel) await logChannel.send({ embeds: [logEmbed] });

          try {
            await logPayment({
              invoiceId,
              seller: interaction.user.tag,
              client: user.tag,
              amount: `₹${amount}`,
              item,
              status: 'Confirmed',
              timestamp: new Date().toISOString(),
            });
            console.log('[DEBUG] Logged to Google Sheets');
          } catch (err) {
            console.error('❌ Google Sheets log failed:', err);
          }

          collector.stop('confirmed');
        } else {
          await i.update({
            embeds: [
              EmbedBuilder.from(embed)
                .setTitle('❌ Payment Cancelled')
                .setColor('#e74c3c')
                .setFooter({ text: 'This request has been cancelled.' })
            ],
            components: [disabled],
          });

          const cancelEmbed = new EmbedBuilder()
            .setTitle('❌ Payment Cancelled')
            .setColor('#e74c3c')
            .addFields(
              { name: 'User', value: interaction.user.tag, inline: true },
              { name: 'Amount', value: `₹${amount}`, inline: true },
              { name: 'Item', value: item, inline: true }
            )
            .setTimestamp();

          if (logChannel) await logChannel.send({ embeds: [cancelEmbed] });
          collector.stop('cancelled');
        }
      });

      collector.on('end', async (_, reason) => {
        if (reason === 'time') {
          console.log('[DEBUG] Payment timed out');
          if (message.deletable) await message.delete().catch(() => {});
        }
      });

    } catch (err) {
      console.error('❌ /pay error:', err);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '❌ An unexpected error occurred.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ An unexpected error occurred.', ephemeral: true });
        }
      } catch (err2) {
        console.error('⚠️ Failed to send error reply:', err2);
      }
    }
  }
};
