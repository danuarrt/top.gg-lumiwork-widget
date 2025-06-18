import express from 'express';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';

const app = express();
const PORT = process.env.PORT || 3000;

// Bot Config
const BOT_ID = '1374161486510948464';
const API_TOKEN = process.env.TOP_GG_API_TOKEN;

app.get('/widget.png', async (req, res) => {
  try {
    const response = await fetch(`https://top.gg/api/bots/${BOT_ID}/stats`, {
      headers: { Authorization: API_TOKEN }
    });

    const data = await response.json();
    const votes = data.totalVotes || 0;

    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1e1e2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bot Avatar
    const avatar = await loadImage('https://i.imgur.com/Ze08bGk.png');
    ctx.drawImage(avatar, 30, 30, 128, 128);

    // Bot Name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Sans';
    ctx.fillText('Lumiwork', 180, 80);

    // ===== Votes Text with Oval Background =====
    const formattedVotes = `${votes.toLocaleString()} votes`;
    ctx.font = '28px Sans';
    const voteTextWidth = ctx.measureText(formattedVotes).width;
    const voteX = (canvas.width - voteTextWidth) / 2;
    const voteY = 145;

    // Oval-style background behind votes
    const padding = 25;
    const bgWidth = voteTextWidth + padding;
    const bgHeight = 44;
    const bgX = (canvas.width - bgWidth) / 2;
    const bgY = voteY - 32;

    ctx.fillStyle = '#2c2c3d';
    ctx.beginPath();
    ctx.moveTo(bgX + 20, bgY);
    ctx.lineTo(bgX + bgWidth - 20, bgY);
    ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + 20);
    ctx.lineTo(bgX + bgWidth, bgY + bgHeight - 20);
    ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - 20, bgY + bgHeight);
    ctx.lineTo(bgX + 20, bgY + bgHeight);
    ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - 20);
    ctx.lineTo(bgX, bgY + 20);
    ctx.quadraticCurveTo(bgX, bgY, bgX + 20, bgY);
    ctx.closePath();
    ctx.fill();

    // Vote Text
    ctx.fillStyle = 'white';
    ctx.fillText(formattedVotes, voteX, voteY);

    // ===== Vote Prompt =====
    const promptText = 'Vote Lumiwork on Top.gg';
    ctx.font = 'bold 20px Sans';
    const promptTextWidth = ctx.measureText(promptText).width;
    const promptX = (canvas.width - promptTextWidth - 30) / 2; // leave space for icon
    const promptY = 220;

    // Red background bar
    ctx.fillStyle = '#FF3366';
    ctx.fillRect(0, promptY - 25, canvas.width, 40);

    // Prompt Text
    ctx.fillStyle = 'white';
    ctx.fillText(promptText, promptX + 30, promptY); // offset for logo

    // Load and draw Top.gg logo (PNG)
    const topggLogo = await loadImage('https://i.imgur.com/SZ9Gvks.png'); // PNG logo
    ctx.drawImage(topggLogo, promptX, promptY - 20, 24, 24); // 24x24 icon

    // Output as PNG
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
  } catch (err) {
    console.error('Image Error:', err);
    res.status(500).send('Error generating image');
  }
});

app.listen(PORT, () => {
  console.log(`Widget is live on port ${PORT}`);
});
