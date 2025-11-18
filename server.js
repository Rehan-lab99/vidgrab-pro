const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple middleware
app.use(express.static(__dirname));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Demo API - Always works
app.get('/api/video-info', (req, res) => {
    try {
        const videoUrl = req.query.url || '';
        
        // Always return success with demo data
        res.json({
            title: 'YouTube Video - ' + (videoUrl ? 'Loaded' : 'Demo'),
            duration: '10:30',
            views: '1.5M views',
            thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop',
            author: 'YouTube Channel',
            success: true
        });
    } catch (error) {
        res.json({
            title: 'Demo Video',
            duration: '5:20', 
            views: '500K views',
            thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop',
            author: 'Demo Channel',
            success: true
        });
    }
});

// Download API - Simple version
app.get('/api/download', (req, res) => {
    res.json({
        message: 'Download feature would start here',
        note: 'This is a demo. Actual download requires additional setup.',
        success: true
    });
});

// Start server
app.listen(PORT, () => {
    console.log('✅ Server started successfully on port ' + PORT);
    console.log('📍 http://localhost:' + PORT);
});
