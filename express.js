import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = process.env.DISCORD_COMMITS_WEBHOOK;

app.post('/github', async (req, res) => {
  const { repository, commits, ref, pusher, sender } = req.body;

  if (!commits || commits.length === 0) return res.sendStatus(204);

  const branchName = ref.split('/').pop();
  const repoName = repository.full_name;
  const commitCount = commits.length;

  const commitLines = commits.map(c => {
    const shortID = c.id.substring(0, 7);
    const author = c.author?.name || 'Unknown';
    return `[\`${shortID}\`](${c.url}) ${c.message} — **${author}**`;
  }).join('\n');

  const embed = {
    title: `[${repoName}:${branchName}] ${commitCount} new commit${commitCount > 1 ? 's' : ''}`,
    description: commitLines,
    color: 0x2ecc71,
    timestamp: new Date().toISOString(),
    author: {
      name: pusher.name,
      icon_url: sender?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
    },
    footer: {
      text: `Pushed by ${pusher.name}`
    }
  };

  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    console.log(`✅ Commit webhook sent for ${pusher.name}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Failed to send Discord webhook:', err);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log('✅ Commit Notifier is live on port 3000'));
