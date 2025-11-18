// ProTube Downloader - Professional YouTube Downloader
console.log('🚀 ProTube Downloader Loaded!');

class ProTubeDownloader {
    constructor() {
        this.currentVideoUrl = '';
        this.currentVideoInfo = null;
        this.init();
    }

    init() {
        this.bindEvents();
        console.log('✅ ProTube Downloader Initialized');
    }

    bindEvents() {
        // Enter key support
        document.getElementById('videoUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchVideoInfo();
        });

        // Auto-focus on input
        setTimeout(() => {
            document.getElementById('videoUrl').focus();
        }, 1000);
    }

    async fetchVideoInfo() {
        const videoUrl = document.getElementById('videoUrl').value.trim();
        const button = document.getElementById('mainBtn');

        if (!videoUrl) {
            this.showNotification('❌ Please enter a YouTube URL', 'error');
            return;
        }

        if (!this.isValidYouTubeUrl(videoUrl)) {
            this.showNotification('❌ Please enter a valid YouTube URL', 'error');
            return;
        }

        this.currentVideoUrl = videoUrl;

        // Show loading state
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        button.disabled = true;

        try {
            this.showNotification('🔍 Fetching video information...', 'info');

            const response = await fetch(`/api/video-info?url=${encodeURIComponent(videoUrl)}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch video info');
            }

            const videoInfo = await response.json();
            this.currentVideoInfo = videoInfo;
            
            this.displayVideoInfo(videoInfo);
            this.showNotification('✅ Video info loaded successfully!', 'success');

        } catch (error) {
            console.error('Error:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            button.innerHTML = '<i class="fas fa-play"></i> Get Video';
            button.disabled = false;
        }
    }

    displayVideoInfo(videoInfo) {
        const videoSection = document.getElementById('videoInfo');
        
        // Update video details
        document.getElementById('thumbnailImg').src = videoInfo.thumbnail;
        document.getElementById('videoTitle').textContent = videoInfo.title;
        document.getElementById('videoDuration').textContent = videoInfo.duration;
        document.getElementById('videoViews').textContent = videoInfo.views + ' views';
        document.getElementById('videoAuthor').textContent = videoInfo.author;

        // Show section with animation
        videoSection.style.display = 'block';
        setTimeout(() => {
            videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    async startDownload(quality) {
        if (!this.currentVideoUrl) {
            this.showNotification('❌ Please enter a YouTube URL first', 'error');
            return;
        }

        try {
            this.showNotification(`⏳ Starting ${quality} download...`, 'info');

            // Create download link
            const downloadUrl = `/api/download?url=${encodeURIComponent(this.currentVideoUrl)}&quality=${quality}`;
            
            // Test if download endpoint is accessible
            const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
            
            if (!testResponse.ok) {
                throw new Error('Download server not responding');
            }

            // Create and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.style.display = 'none';
            
            // Generate filename
            const filename = this.currentVideoInfo ? 
                this.currentVideoInfo.title.replace(/[^\w\s]/gi, '_') + '.mp4' : 
                'youtube_video.mp4';
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification(`✅ Download started for ${quality}!`, 'success');

        } catch (error) {
            console.error('Download error:', error);
            this.showNotification(`❌ Download failed: ${error.message}`, 'error');
            
            // Fallback: open in new tab
            const fallbackUrl = `/api/download?url=${encodeURIComponent(this.currentVideoUrl)}&quality=${quality}`;
            window.open(fallbackUrl, '_blank');
        }
    }

    isValidYouTubeUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            /^(https?:\/\/)?(www\.)?(youtu\.be\/)([a-zA-Z09_-]{11})/,
            /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.getElementById('notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);

        // Auto hide after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Initialize the application
const proTube = new ProTubeDownloader();

// Global functions for HTML onclick
function fetchVideoInfo() {
    proTube.fetchVideoInfo();
}

function startDownload(quality) {
    proTube.startDownload(quality);
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to quality cards
    const qualityCards = document.querySelectorAll('.quality-card');
    qualityCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    console.log('🎉 ProTube Downloader Ready!');
});
