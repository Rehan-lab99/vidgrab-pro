const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Real database (in production use MongoDB/PostgreSQL)
let database = {
    stats: {
        totalDownloads: 0,
        successfulDownloads: 0,
        failedDownloads: 0,
        blockedVideos: [],
        startDate: new Date().toISOString()
    },
    settings: {
        maxFileSize: 500, // MB
        allowedQualities: ['144p', '360p', '480p', '720p', '1080p'],
        rateLimit: 10, // downloads per hour per IP
        maintenance: false
    },
    users: [
        {
            username: 'admin',
            password: 'admin123', // Change this in production
            role: 'admin'
        }
    ]
};

// Rate limiting
const rateLimitMap = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }
    
    const requests = rateLimitMap.get(ip);
    const windowStart = now - windowMs;
    
    // Clean old requests
    const recentRequests = requests.filter(time => time > windowStart);
    rateLimitMap.set(ip, recentRequests);
    
    if (recentRequests.length >= database.settings.rateLimit) {
        return false;
    }
    
    recentRequests.push(now);
    return true;
}

// Authentication middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    const user = database.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.user = user;
    next();
}

// Video download
app.get('/api/download', async (req, res) => {
    try {
        // Check maintenance mode
        if (database.settings.maintenance) {
            return res.status(503).json({ error: 'Service under maintenance' });
        }

        const videoUrl = req.query.url;
        const quality = req.query.quality || 'highest';
        const clientIP = req.ip || req.connection.remoteAddress;

        // Rate limiting
        if (!checkRateLimit(clientIP)) {
            return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
        }

        if (!videoUrl) {
            database.stats.failedDownloads++;
            return res.status(400).json({ error: 'YouTube URL required' });
        }

        if (!ytdl.validateURL(videoUrl)) {
            database.stats.failedDownloads++;
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Check if video is blocked
        const videoId = ytdl.getVideoID(videoUrl);
        if (database.stats.blockedVideos.includes(videoId)) {
            return res.status(403).json({ error: 'This video cannot be downloaded' });
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '_');

        // Update stats
        database.stats.totalDownloads++;

        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        ytdl(videoUrl, {
            quality: quality,
            filter: format => format.container === 'mp4'
        }).pipe(res);

        database.stats.successfulDownloads++;

    } catch (error) {
        console.error('Download error:', error);
        database.stats.failedDownloads++;
        res.status(500).json({ error: 'Download failed. Try another video.' });
    }
});

// Get video info
app.get('/api/info', async (req, res) => {
    try {
        const videoUrl = req.query.url;

        if (!videoUrl) {
            return res.status(400).json({ error: 'URL required' });
        }

        const info = await ytdl.getInfo(videoUrl);
        
        const videoInfo = {
            title: info.videoDetails.title,
            duration: formatTime(info.videoDetails.lengthSeconds),
            thumbnail: info.videoDetails.thumbnails[3]?.url || info.videoDetails.thumbnails[0]?.url,
            author: info.videoDetails.author.name,
            qualities: getAvailableQualities(info.formats)
        };

        res.json(videoInfo);

    } catch (error) {
        res.status(500).json({ error: 'Failed to get video info' });
    }
});

// Admin API - Get stats
app.get('/api/admin/stats', requireAuth, (req, res) => {
    res.json({
        stats: database.stats,
        rateLimit: rateLimitMap.size,
        serverUptime: process.uptime()
    });
});

// Admin API - Update settings
app.post('/api/admin/settings', requireAuth, (req, res) => {
    const { maxFileSize, allowedQualities, rateLimit, maintenance } = req.body;
    
    if (maxFileSize) database.settings.maxFileSize = maxFileSize;
    if (allowedQualities) database.settings.allowedQualities = allowedQualities;
    if (rateLimit) database.settings.rateLimit = rateLimit;
    if (typeof maintenance === 'boolean') database.settings.maintenance = maintenance;
    
    res.json({ message: 'Settings updated', settings: database.settings });
});

// Admin API - Block video
app.post('/api/admin/block-video', requireAuth, (req, res) => {
    const { videoId } = req.body;
    
    if (!videoId) {
        return res.status(400).json({ error: 'Video ID required' });
    }
    
    if (!database.stats.blockedVideos.includes(videoId)) {
        database.stats.blockedVideos.push(videoId);
    }
    
    res.json({ message: 'Video blocked', blockedVideos: database.stats.blockedVideos });
});

// Admin API - Reset stats
app.post('/api/admin/reset-stats', requireAuth, (req, res) => {
    database.stats = {
        totalDownloads: 0,
        successfulDownloads: 0,
        failedDownloads: 0,
        blockedVideos: database.stats.blockedVideos,
        startDate: new Date().toISOString()
    };
    
    res.json({ message: 'Stats reset', stats: database.stats });
});

// Public stats
app.get('/api/stats', (req, res) => {
    res.json({
        totalDownloads: database.stats.totalDownloads,
        successRate: database.stats.totalDownloads > 0 ? 
            ((database.stats.successfulDownloads / database.stats.totalDownloads) * 100).toFixed(1) + '%' : '0%'
    });
});

// Helper functions
function getAvailableQualities(formats) {
    const qualities = new Set();
    
    formats.forEach(format => {
        if (format.qualityLabel && format.hasVideo && format.hasAudio) {
            qualities.add(format.qualityLabel);
        }
    });

    return Array.from(qualities)
        .filter(quality => database.settings.allowedQualities.some(allowed => quality.includes(allowed)))
        .sort((a, b) => parseInt(b) - parseInt(a));
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`
🚀 YouTube Downloader with Admin Panel
📍 Port: ${PORT}
🔧 Admin Panel: http://localhost:${PORT}/admin
👤 Default Credentials: admin / admin123

💡 Features:
✅ Real video downloads
✅ Admin panel for management
✅ Rate limiting
✅ Block videos
✅ Download statistics
✅ Maintenance mode
    `.trim());
});
