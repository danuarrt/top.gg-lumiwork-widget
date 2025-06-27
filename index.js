import express from 'express';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';
import dotenv from 'dotenv';
import ora from 'ora';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_ID = '1374161486510948464';
const API_TOKEN = process.env.TOP_GG_API_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Spinner startup
const spinner = ora({
  text: 'Starting Lumiwork widget server...',
  spinner: 'shark' // Bisa diganti 'dots', 'pong', dll.
}).start();

// Ambil username owner dari Discord API
const fetchUsername = async (id) => {
  try {
    const userRes = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${DISCORD_TOKEN}` }
    });
    if (!userRes.ok) return null;
    const userData = await userRes.json();
    return `${userData.username}#${userData.discriminator}`;
  } catch (e) {
    console.error('Owner fetch error:', e);
    return null;
  }
};

// Endpoint image Top.gg widget
app.get('/widget.png', async (req, res) => {
  try {
    const [statsRes, detailRes] = await Promise.all([
      fetch(`https://top.gg/api/bots/${BOT_ID}/stats`, {
        headers: { Authorization: API_TOKEN }
      }),
      fetch(`https://top.gg/api/bots/${BOT_ID}`, {
        headers: { Authorization: API_TOKEN }
      })
    ]);

    const stats = await statsRes.json();
    const details = await detailRes.json();

    const votes = stats.monthly_votes ?? details.points ?? 0;
    const servers = stats.server_count ?? details.server_count ?? 0;

    const ownerId = details.owners?.[0] || null;
    const ownerUsername = ownerId ? await fetchUsername(ownerId) : 'Unknown';

    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e1e2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const avatar = await loadImage('https://i.imgur.com/Ze08bGk.png');
    ctx.save();
    ctx.beginPath();
    ctx.arc(94, 94, 64, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 30, 30, 128, 128);
    ctx.restore();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Sans';
    ctx.fillText('Lumiwork', 180, 76);

    const renderBox = (text, x, y) => {
      const infoFont = 'bold 20px Sans';
      ctx.font = infoFont;
      const textWidth = ctx.measureText(text).width;
      const padding = 20;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = 36;
      const boxX = x - boxWidth / 2;
      const boxY = y - boxHeight / 2;

      ctx.fillStyle = '#292944';
      ctx.beginPath();
      ctx.moveTo(boxX + 10, boxY);
      ctx.lineTo(boxX + boxWidth - 10, boxY);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + 10);
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight - 10);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - 10, boxY + boxHeight);
      ctx.lineTo(boxX + 10, boxY + boxHeight);
      ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - 10);
      ctx.lineTo(boxX, boxY + 10);
      ctx.quadraticCurveTo(boxX, boxY, boxX + 10, boxY);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = infoFont;
      ctx.fillText(text, x - textWidth / 2, y + 7);
    };

    renderBox(`${votes.toLocaleString()} votes`, 290, 135);
    renderBox(`${servers.toLocaleString()} servers`, 510, 135);
    renderBox(`Owner: ${ownerUsername}`, 400, 180);

    ctx.fillStyle = '#FF3366';
    ctx.fillRect(0, 200, canvas.width, 50);
    const logo = await loadImage('https://i.imgur.com/SZ9Gvks.png');
    ctx.drawImage(logo, 503, 212, 24, 24);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px Sans';
    ctx.fillText('Vote Lumiwork on', 270, 232);
    ctx.fillText('Top.gg', 534, 232);

    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    ctx.fillStyle = 'black';
    ctx.font = 'italic 6px Sans';
    ctx.fillText(`Last updated: ${timeString}`, 10, 245);

    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (err) {
    console.error('Image Error:', err);
    res.status(500).send('Error generating image');
  }
});

app.use(express.json());

// Vote webhook
app.post('/vote', async (req, res) => {
  const { user } = req.body;
  if (!user) return res.status(400).send('Invalid payload');

  const discordWebhookURL = process.env.DISCORD_WEBHOOK_URL;

  try {
    await fetch(discordWebhookURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Top.gg Vote',
        avatar_url: 'https://cdn.top.gg/icon.png',
        embeds: [{
          title: 'New Vote!',
          description: `<@${user}> just voted for **Lumiwork** on [Top.gg](https://top.gg/bot/${BOT_ID})!`,
          color: 0xFF3366,
          footer: { text: '${user} has voted!' },
          timestamp: new Date().toISOString()
        }]
      })
    });

    console.log(`✅ Vote webhook sent for user ${user}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Failed to send Discord webhook:', err);
    res.sendStatus(500);
  }
});

// GitHub commits webhook
app.post('/github', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const { commits, repository, pusher, ref } = req.body;
    if (!commits || commits.length === 0) return res.sendStatus(200);

    const latest = commits[commits.length - 1];
    const shortSha = latest.id.substring(0, 7);
    const branch = ref.split('/').pop();

    const embed = {
      author: {
        name: `${repository.full_name}:${branch}`,
        icon_url: repository.owner.avatar_url,
        url: repository.html_url
      },
      description: `[\`${shortSha}\`](${latest.url}) ${latest.message} — **${pusher.name}**`,
      color: 0x24292f,
      timestamp: new Date().toISOString()
    };

    await fetch(process.env.GITHUB_COMMITS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    console.log(`✅ GitHub commit: ${shortSha}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ GitHub Webhook Error:', err);
    res.sendStatus(400);
  }
});

// Start server
app.listen(PORT, () => {
  spinner.succeed(`✅ Lumiwork widget server is live on port ${PORT}`);
});
