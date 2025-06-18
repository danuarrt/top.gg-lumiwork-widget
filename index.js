import express from 'express';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';

const app = express();
const PORT = process.env.PORT || 3000;

// Bot config
const BOT_ID = '1374161486510948464';
const API_TOKEN = process.env.TOP_GG_API_TOKEN;

app.get('/widget.png', async (req, res) => {
  try {
    // Ambil data vote dari API Top.gg
    const response = await fetch(`https://top.gg/api/bots/${BOT_ID}/stats`, {
      headers: { Authorization: API_TOKEN }
    });
    const data = await response.json();
    const votes = data.totalVotes || 0;

    // Format angka votes
    const formattedVotes = votes.toLocaleString();

    // Canvas setup
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1e1e2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Avatar (lingkaran)
    const avatar = await loadImage('https://i.imgur.com/Ze08bGk.png');
    ctx.save();
    ctx.beginPath();
    ctx.arc(94, 94, 64, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 30, 30, 128, 128);
    ctx.restore();

    // Bot Name (Lumiwork)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Sans';
    ctx.fillText('Lumiwork', 180, 85);

    // Oval background untuk total votes
    const voteText = `${formattedVotes} votes`;
    ctx.font = 'bold 30px Sans';
    const voteWidth = ctx.measureText(voteText).width + 60;
    const voteX = (canvas.width - voteWidth) / 2;
    const voteY = 140;

    // Oval background (rounded rectangle)
    ctx.fillStyle = '#292944';
    ctx.beginPath();
    ctx.moveTo(voteX, voteY);
    ctx.lineTo(voteX + voteWidth, voteY);
    ctx.quadraticCurveTo(voteX + voteWidth + 20, voteY, voteX + voteWidth + 20, voteY + 40);
    ctx.lineTo(voteX + voteWidth + 20, voteY + 40);
    ctx.quadraticCurveTo(voteX + voteWidth + 20, voteY + 80, voteX + voteWidth, voteY + 80);
    ctx.lineTo(voteX, voteY + 80);
    ctx.quadraticCurveTo(voteX - 20, voteY + 80, voteX - 20, voteY + 40);
    ctx.lineTo(voteX - 20, voteY + 40);
    ctx.quadraticCurveTo(voteX - 20, voteY, voteX, voteY);
    ctx.fill();

    // Total votes text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Sans';
    ctx.fillText(voteText, (canvas.width - ctx.measureText(voteText).width) / 2, voteY + 50);

    // Banner bawah: "Vote Lumiwork on (logo) Top.gg"
    ctx.fillStyle = '#FF3366';
    ctx.fillRect(0, 200, canvas.width, 50);

    const logo = await loadImage('https://i.imgur.com/SZ9Gvks.png'); // Top.gg logo PNG kecil
    ctx.drawImage(logo, 345, 212, 24, 24);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px Sans';
    ctx.fillText('Vote Lumiwork on', 230, 232);
    ctx.fillText('Top.gg', 375, 232);

    // Output sebagai PNG
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
