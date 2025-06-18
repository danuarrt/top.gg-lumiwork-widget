import express from 'express';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';

const app = express();
const PORT = process.env.PORT || 3000;

// Ganti ID & Token Top.gg kamu di sini
const BOT_ID = '1374161486510948464';
const API_TOKEN = process.env.TOP_GG_API_TOKEN;

app.get('/widget.png', async (req, res) => {
  try {
    const response = await fetch(`https://top.gg/api/bots/${BOT_ID}`, {
      headers: { Authorization: API_TOKEN }
    });

    const data = await response.json();
    const votes = data.votes || 0;

    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1e1e2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bot Avatar
    const avatar = await loadImage('https://cdn.discordapp.com/attachments/1202471761065549844/1384975344552902758/B474B74F-995A-4A97-956B-3B4E9606D58E.png');
    ctx.drawImage(avatar, 30, 30, 128, 128);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Sans';
    ctx.fillText('Vote My Bot on Top.gg', 180, 70);

    ctx.font = '28px Sans';
    ctx.fillText(`Total Votes: ${votes}`, 180, 120);

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
