const { EmbedBuilder, PermissionsBitField, Events } = require('discord.js');

module.exports = {
  name: 'log',
  once: true,
  async execute(client) {
    const LOG_CHANNEL_ID = 'YOUR_LOG_CHANNEL_ID'; // Replace with your log channel ID

    const getLogChannel = (guild) => {
      return guild.channels.cache.get(LOG_CHANNEL_ID);
    };

    // MEMBER JOIN/LEAVE
    client.on(Events.GuildMemberAdd, (member) => {
      const embed = new EmbedBuilder()
        .setTitle('📥 Member Joined')
        .setDescription(`${member} joined the server.`)
        .setColor('Green')
        .setTimestamp();

      getLogChannel(member.guild)?.send({ embeds: [embed] });
    });

    client.on(Events.GuildMemberRemove, (member) => {
      const embed = new EmbedBuilder()
        .setTitle('📤 Member Left')
        .setDescription(`${member.user.tag} left the server.`)
        .setColor('Red')
        .setTimestamp();

      getLogChannel(member.guild)?.send({ embeds: [embed] });
    });

    // MESSAGE DELETE
    client.on(Events.MessageDelete, async (message) => {
      if (message.partial || !message.guild || message.author?.bot) return;

      const embed = new EmbedBuilder()
        .setTitle('🗑️ Message Deleted')
        .addFields(
          { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: 'Channel', value: `${message.channel}`, inline: true },
          { name: 'Content', value: message.content || 'No content' }
        )
        .setColor('Red')
        .setTimestamp();

      getLogChannel(message.guild)?.send({ embeds: [embed] });
    });

    // MESSAGE UPDATE
    client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
      if (oldMsg.partial || newMsg.partial || !oldMsg.guild || oldMsg.author?.bot) return;
      if (oldMsg.content === newMsg.content) return;

      const embed = new EmbedBuilder()
        .setTitle('✏️ Message Edited')
        .addFields(
          { name: 'User', value: `${oldMsg.author.tag}`, inline: true },
          { name: 'Channel', value: `${oldMsg.channel}`, inline: true },
          { name: 'Before', value: oldMsg.content || 'N/A' },
          { name: 'After', value: newMsg.content || 'N/A' }
        )
        .setColor('Orange')
        .setTimestamp();

      getLogChannel(oldMsg.guild)?.send({ embeds: [embed] });
    });

    // CHANNEL CREATE/DELETE/UPDATE
    client.on(Events.ChannelCreate, (channel) => {
      const embed = new EmbedBuilder()
        .setTitle('📁 Channel Created')
        .setDescription(`Channel created: ${channel.name}`)
        .setColor('Green')
        .setTimestamp();

      getLogChannel(channel.guild)?.send({ embeds: [embed] });
    });

    client.on(Events.ChannelDelete, (channel) => {
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Channel Deleted')
        .setDescription(`Channel deleted: ${channel.name}`)
        .setColor('Red')
        .setTimestamp();

      getLogChannel(channel.guild)?.send({ embeds: [embed] });
    });

    client.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
      if (oldChannel.name !== newChannel.name) {
        const embed = new EmbedBuilder()
          .setTitle('✏️ Channel Renamed')
          .addFields(
            { name: 'Before', value: oldChannel.name, inline: true },
            { name: 'After', value: newChannel.name, inline: true }
          )
          .setColor('Yellow')
          .setTimestamp();

        getLogChannel(newChannel.guild)?.send({ embeds: [embed] });
      }
    });

    // ROLE CREATE/DELETE/UPDATE
    client.on(Events.GuildRoleCreate, (role) => {
      const embed = new EmbedBuilder()
        .setTitle('🎭 Role Created')
        .setDescription(`Role created: ${role.name}`)
        .setColor('Green')
        .setTimestamp();

      getLogChannel(role.guild)?.send({ embeds: [embed] });
    });

    client.on(Events.GuildRoleDelete, (role) => {
      const embed = new EmbedBuilder()
        .setTitle('❌ Role Deleted')
        .setDescription(`Role deleted: ${role.name}`)
        .setColor('Red')
        .setTimestamp();

      getLogChannel(role.guild)?.send({ embeds: [embed] });
    });

    client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
      if (oldRole.name !== newRole.name) {
        const embed = new EmbedBuilder()
          .setTitle('🔁 Role Renamed')
          .addFields(
            { name: 'Before', value: oldRole.name, inline: true },
            { name: 'After', value: newRole.name, inline: true }
          )
          .setColor('Yellow')
          .setTimestamp();

        getLogChannel(newRole.guild)?.send({ embeds: [embed] });
      }
    });

    // VOICE STATE UPDATE
    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      const member = newState.member;
      const embed = new EmbedBuilder().setTimestamp();

      if (!oldState.channel && newState.channel) {
        embed
          .setTitle('🔊 Joined Voice Channel')
          .setDescription(`${member} joined ${newState.channel.name}`)
          .setColor('Green');
      } else if (oldState.channel && !newState.channel) {
        embed
          .setTitle('📴 Left Voice Channel')
          .setDescription(`${member} left ${oldState.channel.name}`)
          .setColor('Red');
      } else if (oldState.channel?.id !== newState.channel?.id) {
        embed
          .setTitle('🔁 Moved Voice Channel')
          .setDescription(`${member} moved from ${oldState.channel.name} to ${newState.channel.name}`)
          .setColor('Orange');
      }

      if (embed.data.title) {
        getLogChannel(member.guild)?.send({ embeds: [embed] });
      }
    });

    // BAN/UNBAN
    client.on(Events.GuildBanAdd, (ban) => {
      const embed = new EmbedBuilder()
        .setTitle('🔨 Member Banned')
        .setDescription(`${ban.user.tag} was banned.`)
        .setColor('DarkRed')
        .setTimestamp();

      getLogChannel(ban.guild)?.send({ embeds: [embed] });
    });

    client.on(Events.GuildBanRemove, (ban) => {
      const embed = new EmbedBuilder()
        .setTitle('⚖️ Member Unbanned')
        .setDescription(`${ban.user.tag} was unbanned.`)
        .setColor('Green')
        .setTimestamp();

      getLogChannel(ban.guild)?.send({ embeds: [embed] });
    });
  },
};
