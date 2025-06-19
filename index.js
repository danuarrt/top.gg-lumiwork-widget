import express from 'express';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_ID = '1374161486510948464';
const API_TOKEN = process.env.TOP_GG_API_TOKEN;
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Fungsi ambil username owner dari Discord API
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

    ctx.fillStyle = '#AAAAAA';
    ctx.font = 'italic 14px Sans';
    ctx.fillText(`Last updated: ${timeString}`, 10, 245);

    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (err) {
    console.error('Image Error:', err);
    res.status(500).send('Error generating image');
  }
});

app.use(express.json());

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
          title: '🗳️ New Vote!',
          description: `<@${user}> just voted for **Lumiwork** on [Top.gg](https://top.gg/bot/${BOT_ID})!`,
          color: 0xFF3366,
          footer: { text: 'Thank you for your support!' },
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

app.listen(PORT, () => {
  console.log(`Widget is live on port ${PORT}`);
});

app.use(express.json());

app.post('/github', (req, res) => {
  const payload = req.body;
  const commits = payload.commits || [];
  const repo = payload.repository?.full_name || 'Unknown Repo';
  const avatar = payload.sender?.avatar_url;
  const author = payload.sender?.login;

  if (!commits.length) return res.sendStatus(204);

  const commit = commits[0];

  fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: repo,
      avatar_url: avatar,
      embeds: [
        {
          title: `📦 [${repo}] ${commits.length} new commit${commits.length > 1 ? 's' : ''}`,
          description: `\`${commit.id.slice(0, 7)}\` ${commit.message} — **${commit.author.name}**`,
          url: commit.url,
          color: 0x2ecc71,
          timestamp: new Date().toISOString(),
          author: {
            name: author,
            icon_url: avatar
          }
        }
      ]
    })
  }).then(() => {
    console.log(`✅ GitHub commit sent by ${author}`);
    res.sendStatus(200);
  }).catch(err => {
    console.error('❌ Failed to send GitHub webhook:', err);
    res.sendStatus(500);
  });
});
