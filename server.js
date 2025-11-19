const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

// SIMPLE & WORKING DOWNLOAD
app.get('/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        
        if (!videoUrl) {
            return res.status(400).send('Please provide YouTube URL');
        }

        console.log('Downloading:', videoUrl);

        // Get video info
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '_');
        
        // Set headers for download
        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.header('Content-Type', 'video/mp4');

        // Download the video
        ytdl(videoUrl, {
            quality: 'highest',
            filter: 'audioandvideo'
        }).pipe(res);

    } catch (error) {
        console.error('ERROR:', error);
        res.status(500).send('Download failed: ' + error.message);
    }
});

// Get video info
app.get('/info', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'URL required' });
        }

        const info = await ytdl.getInfo(videoUrl);
        
        res.json({
            title: info.videoDetails.title,
            duration: formatTime(info.videoDetails.lengthSeconds),
            thumbnail: info.videoDetails.thumbnails[0].url,
            author: info.videoDetails.author.name
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 YouTube Downloader WORKING on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});
