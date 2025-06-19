import express from 'express';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';

const app = express();
const PORT = process.env.PORT || 3000;

const BOT_ID = '1374161486510948464';
const API_TOKEN = process.env.TOP_GG_API_TOKEN;

app.get('/widget.png', async (req, res) => {
  try {
    // Fetch dari dua endpoint: stats & bot detail
    const [statsRes, detailRes] = await Promise.all([
      fetch(`https://top.gg/api/bots/${BOT_ID}/stats`, {
        headers: { Authorization: API_TOKEN }
      }),
      fetch(`https://top.gg/api/bots/${BOT_ID}`, {
        headers: { Authorization: API_TOKEN }
      })
    ]);

    console.log(`Stats Status: ${statsRes.status}`);
    console.log(`Detail Status: ${detailRes.status}`);

    const stats = await statsRes.json();
    const details = await detailRes.json();

    console.log('Stats JSON:', stats);
    console.log('Detail JSON:', details);

    const votes = stats.monthly_votes || 0;
    const servers = stats.server_count || 0;
    const owner = details.owner?.username || 'Unknown';

    console.log(`Parsed Votes: ${votes}`);
    console.log(`Parsed Servers: ${servers}`);
    console.log(`Parsed Owner: ${owner}`);

    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1e1e2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bot Avatar bulat
    const avatar = await loadImage('https://i.imgur.com/Ze08bGk.png');
    ctx.save();
    ctx.beginPath();
    ctx.arc(94, 94, 64, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 30, 30, 128, 128);
    ctx.restore();

    // Bot name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Sans';
    ctx.fillText('Lumiwork', 180, 76);

    // ======= TEXT BLOCKS: votes, servers, owner =======
    const infoFont = 'bold 20px Sans';
    const textColor = 'white';
    const boxColor = '#292944';

    const renderBox = (text, x, y) => {
      ctx.font = infoFont;
      const textWidth = ctx.measureText(text).width;
      const padding = 20;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = 36;

      const boxX = x - boxWidth / 2;
      const boxY = y - boxHeight / 2;

      ctx.fillStyle = boxColor;
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

      // Text
      ctx.fillStyle = textColor;
      ctx.font = infoFont;
      ctx.fillText(text, x - textWidth / 2, y + 7);
    };

    // Votes & Servers (atas)
    renderBox(`${votes.toLocaleString()} votes`, 290, 135);
    renderBox(`${servers.toLocaleString()} servers`, 510, 135);

    // Owner (di tengah bawahnya, segitiga terbalik)
    renderBox(`Owner: ${owner}`, 400, 180);

    // ======= Banner Merah & Top.gg =======
    ctx.fillStyle = '#FF3366';
    ctx.fillRect(0, 200, canvas.width, 50);

    const logo = await loadImage('https://i.imgur.com/SZ9Gvks.png');
    ctx.drawImage(logo, 503, 212, 24, 24); // geser logo ke kanan

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px Sans';
    ctx.fillText('Vote Lumiwork on', 270, 232);
    ctx.fillText('Top.gg', 534, 232);

    // Output PNG
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
