const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage, registerFont } = require("canvas");

registerFont(path.join(__dirname, "..", "assets", "go3v2.ttf"), {
  family: "GO3",
});

module.exports = async function (member, client) {
  const dataPath = path.join(__dirname, "..", "data", "welcomeConfig.json");
  if (!fs.existsSync(dataPath)) return;

  let config;
  try {
    config = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    console.error("❌ Failed to parse welcomeConfig.json");
    return;
  }

  const guildConfig = config[member.guild.id];
  if (!guildConfig) return;

  const { channelId, roleId } = guildConfig;
  if (!channelId || !roleId) return;

  const canvas = createCanvas(900, 437);
  const ctx = canvas.getContext("2d");

  const bgPath = path.join(__dirname, "..", "assets", "background.png");
  if (!fs.existsSync(bgPath)) {
    console.error("❌ Background image not found at:", bgPath);
    return;
  }

  let bg;
  try {
    bg = await loadImage(bgPath);
  } catch (err) {
    console.error("❌ Could not load background:", err);
    return;
  }

  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // Load user avatar
  const avatarURL = member.user.displayAvatarURL({ extension: "png", size: 256 });
  let avatar;
  try {
    avatar = await loadImage(avatarURL);
  } catch (err) {
    console.error("❌ Could not load avatar:", err);
    return;
  }

const avatarSize = 150;
const centerX = canvas.width / 2;
const avatarY = 175; // Perfectly aligned under "PLAY", above "WELCOME"

// Border
ctx.beginPath();
ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 8;
ctx.stroke();

// Clipped avatar
ctx.save();
ctx.beginPath();
ctx.arc(centerX, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
ctx.clip();
ctx.drawImage(avatar, centerX - avatarSize / 2, avatarY, avatarSize, avatarSize);
ctx.restore();


  const buffer = canvas.toBuffer("image/png");

  const channel = member.guild.channels.cache.get(channelId);
  if (channel) {
    await channel.send({ files: [{ attachment: buffer, name: "welcome.png" }] });
  }

  const role = member.guild.roles.cache.get(roleId);
  if (role) {
    try {
      await member.roles.add(role);
    } catch (err) {
      console.error("❌ Could not add role:", err);
    }
  }
};
