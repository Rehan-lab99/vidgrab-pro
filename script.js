// Real YouTube Downloader - Working Frontend
console.log('🎯 Real YouTube Downloader Loaded!');

class RealYouTubeDownloader {
    constructor() {
        this.currentVideoUrl = '';
        this.currentVideoInfo = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.testConnection();
    }

    bindEvents() {
        document.getElementById('videoUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchVideoInfo();
        });
    }

    async testConnection() {
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            console.log('✅ Backend Connection:', data);
        } catch (error) {
            console.log('❌ Backend Connection Failed');
        }
    }

    async fetchVideoInfo() {
        const videoUrl = document.getElementById('videoUrl').value.trim();
        const button = document.getElementById('mainBtn');

        if (!videoUrl) {
            this.showNotification('❌ YouTube URL paste karein', 'error');
            return;
        }

        if (!this.isValidYouTubeUrl(videoUrl)) {
            this.showNotification('❌ Valid YouTube URL dalen', 'error');
            return;
        }

        this.currentVideoUrl = videoUrl;

        // Show loading
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Video Load Ho Raha Hai...';
        button.disabled = true;

        try {
            this.showNotification('🔍 Video information fetch kar raha hun...', 'info');

            const response = await fetch(`/api/video-info?url=${encodeURIComponent(videoUrl)}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Video load nahi hua');
            }

            const videoInfo = await response.json();
            this.currentVideoInfo = videoInfo;
            
            this.displayVideoInfo(videoInfo);
            this.showNotification('✅ Video successfully load ho gaya!', 'success');

        } catch (error) {
            console.error('Error:', error);
            this.showNotification(`❌ ${error.message}`, 'error');
        } finally {
            button.innerHTML = '<i class="fas fa-download"></i> Video Download Karein';
            button.disabled = false;
        }
    }

    displayVideoInfo(videoInfo) {
        const videoSection = document.getElementById('videoInfo');
        
        // Update video details
        document.getElementById('thumbnailImg').src = videoInfo.thumbnail;
        document.getElementById('videoTitle').textContent = videoInfo.title;
        document.getElementById('videoDuration').textContent = videoInfo.duration;
        document.getElementById('videoViews').textContent = videoInfo.views;
        document.getElementById('videoAuthor').textContent = videoInfo.author;

        // Show available formats
        this.showAvailableQualities(videoInfo.formats);

        // Show section
        videoSection.style.display = 'block';
        videoSection.scrollIntoView({ behavior: 'smooth' });
    }

    showAvailableQualities(formats) {
        const qualityGrid = document.querySelector('.quality-grid');
        if (!qualityGrid) return;

        // Clear existing
        qualityGrid.innerHTML = '';

        // Get unique qualities
        const uniqueQualities = [];
        const seen = new Set();

        formats.forEach(format => {
            if (format.quality && !seen.has(format.quality)) {
                seen.add(format.quality);
                uniqueQualities.push(format);
            }
        });

        // Sort by quality (highest first)
        uniqueQualities.sort((a, b) => {
            const qualityA = parseInt(a.quality) || 0;
            const qualityB = parseInt(b.quality) || 0;
            return qualityB - qualityA;
        });

        // Add quality cards
        uniqueQualities.forEach(format => {
            const qualityCard = this.createQualityCard(format.quality);
            qualityGrid.appendChild(qualityCard);
        });
    }

    createQualityCard(quality) {
        const card = document.createElement('div');
        card.className = 'quality-card';
        card.onclick = () => this.startDownload(quality);
        
        card.innerHTML = `
            <div class="quality-header">
                <i class="fas fa-hd"></i>
                <span class="quality-name">${quality}</span>
            </div>
            <div class="quality-info">
                <span class="quality-desc">High Quality Video</span>
                <span class="file-size">MP4 Format</span>
            </div>
            <div class="download-arrow">
                <i class="fas fa-arrow-down"></i>
            </div>
        `;
        
        return card;
    }

    async startDownload(quality) {
        if (!this.currentVideoUrl) {
            this.showNotification('❌ Pehle YouTube URL dalen', 'error');
            return;
        }

        try {
            this.showNotification(`⏳ ${quality} quality mein download start ho raha hai...`, 'info');

            // Create download link
            const downloadUrl = `/api/download?url=${encodeURIComponent(this.currentVideoUrl)}&quality=${quality}`;
            
            // Create hidden link
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.style.display = 'none';
            
            // Set filename
            if (this.currentVideoInfo) {
                const filename = this.currentVideoInfo.title.replace(/[^\w\s]/gi, '_') + '.mp4';
                link.download = filename;
            }
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showNotification(`✅ Download shuru ho gaya! ${quality} quality`, 'success');

            // Update stats
            this.updateStats();

        } catch (error) {
            console.error('Download error:', error);
            this.showNotification(`❌ Download failed: ${error.message}`, 'error');
        }
    }

    async updateStats() {
        try {
            await fetch('/api/stats');
        } catch (error) {
            console.log('Stats update failed');
        }
    }

    isValidYouTubeUrl(url) {
        return url.includes('youtube.com/watch') || url.includes('youtu.be/');
    }

    showNotification(message, type = 'info') {
        // Simple alert for now - you can enhance this
        if (type === 'error') {
            alert('❌ ' + message);
        } else if (type === 'success') {
            alert('✅ ' + message);
        } else {
            alert('ℹ️ ' + message);
        }
    }

    // Quick download method
    async quickDownload() {
        if (!this.currentVideoUrl) return;
        
        const downloadUrl = `/api/quick-download?url=${encodeURIComponent(this.currentVideoUrl)}`;
        window.open(downloadUrl, '_blank');
        this.showNotification('🚀 Quick download shuru ho gaya!', 'success');
    }

    // Audio download
    async downloadAudio() {
        if (!this.currentVideoUrl) return;
        
        const downloadUrl = `/api/download-audio?url=${encodeURIComponent(this.currentVideoUrl)}`;
        window.open(downloadUrl, '_blank');
        this.showNotification('🎵 Audio download shuru ho gaya!', 'success');
    }
}

// Initialize
const realDownloader = new RealYouTubeDownloader();

// Global functions
function fetchVideoInfo() {
    realDownloader.fetchVideoInfo();
}

function startDownload(quality) {
    realDownloader.startDownload(quality);
}

function quickDownload() {
    realDownloader.quickDownload();
}

function downloadAudio() {
    realDownloader.downloadAudio();
}
