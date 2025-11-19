class YouTubeDownloader {
    constructor() {
        this.currentVideo = null;
        this.bindEvents();
        this.loadStats();
    }

    bindEvents() {
        document.getElementById('videoUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.getVideoInfo();
        });
    }

    async getVideoInfo() {
        const url = document.getElementById('videoUrl').value.trim();
        const btn = document.getElementById('downloadBtn');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');

        // Reset
        error.style.display = 'none';
        loading.style.display = 'block';
        btn.disabled = true;

        if (!url) {
            this.showError('Please enter a YouTube URL');
            return;
        }

        if (!this.isValidYouTubeUrl(url)) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }

        try {
            const response = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error);
            }

            this.currentVideo = await response.json();
            this.displayVideoInfo();
            
        } catch (err) {
            this.showError(err.message);
        } finally {
            loading.style.display = 'none';
            btn.disabled = false;
        }
    }

    displayVideoInfo() {
        const videoInfo = document.getElementById('videoInfo');
        const thumbnail = document.getElementById('thumbnail');
        const title = document.getElementById('videoTitle');
        const meta = document.getElementById('videoMeta');
        const qualityGrid = document.getElementById('qualityGrid');

        // Set video info
        thumbnail.src = this.currentVideo.thumbnail;
        title.textContent = this.currentVideo.title;
        meta.textContent = `Duration: ${this.currentVideo.duration} • ${this.currentVideo.author}`;

        // Create quality buttons
        qualityGrid.innerHTML = '';
        this.currentVideo.qualities.forEach(quality => {
            const btn = document.createElement('button');
            btn.className = 'quality-btn';
            btn.textContent = quality;
            btn.onclick = () => this.downloadVideo(quality);
            qualityGrid.appendChild(btn);
        });

        // Show video info section
        videoInfo.style.display = 'block';
        videoInfo.scrollIntoView({ behavior: 'smooth' });
    }

    downloadVideo(quality) {
        if (!this.currentVideo) return;

        const downloadUrl = `/api/download?url=${encodeURIComponent(document.getElementById('videoUrl').value)}&quality=${quality}`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Update stats
        setTimeout(() => this.loadStats(), 1000);
    }

    isValidYouTubeUrl(url) {
        return url.includes('youtube.com/watch') || url.includes('youtu.be/');
    }

    showError(message) {
        const error = document.getElementById('error');
        error.textContent = message;
        error.style.display = 'block';
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            document.getElementById('downloadCount').textContent = stats.downloads;
        } catch (err) {
            console.log('Could not load stats');
        }
    }
}

// Initialize
const downloader = new YouTubeDownloader();

// Global functions
function getVideoInfo() {
    downloader.getVideoInfo();
}
