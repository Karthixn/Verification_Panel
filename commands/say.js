module.exports = {
  name: 'say',
  description: 'Make the bot say something in a specified channel.',
  async execute(message, args) {
    const allowedRoleId = process.env.ALLOWED_ROLE_ID;
    if (!message.member.roles.cache.has(allowedRoleId)) {
      return message.reply("❌ You don't have permission to use this command.");
    }

    const text = args.join(" ");
    if (!text) return message.reply("Please provide a message.");

    await message.channel.send(text);
    message.delete().catch(() => {});
  }
};
