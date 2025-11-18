// Enhanced download functionality
async function downloadVideo(quality) {
    if (!this.currentVideoUrl) {
        this.showNotification('❌ Please enter a YouTube URL first', 'error');
        return;
    }

    try {
        this.showNotification(`⏳ Starting ${quality} download...`, 'info');
        this.showProgressBar();

        // Try main download API
        const downloadUrl = `/api/download?url=${encodeURIComponent(this.currentVideoUrl)}&quality=${quality}`;
        
        // Test if API is responsive
        const testResponse = await fetch(`/api/health`);
        if (!testResponse.ok) {
            throw new Error('API server not responding');
        }

        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = 'video.mp4';
        
        // Add to page and trigger click
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            this.hideProgressBar();
        }, 1000);

        // Update statistics
        await this.updateStats('download');
        this.showNotification(`✅ Download started successfully!`, 'success');

    } catch (error) {
        console.error('Download error:', error);
        
        // Fallback to quick download
        try {
            this.showNotification('🔄 Trying alternative method...', 'info');
            await this.quickDownload();
        } catch (fallbackError) {
            this.showNotification(`❌ Download failed: ${error.message}`, 'error');
            this.showAlternativeMethods();
        } finally {
            this.hideProgressBar();
        }
    }
}

// Quick download method
async function quickDownload() {
    const quickUrl = `/api/quick-download?url=${encodeURIComponent(this.currentVideoUrl)}`;
    
    const link = document.createElement('a');
    link.href = quickUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showNotification('✅ Quick download started!', 'success');
}

// Audio download method  
async function downloadAudio() {
    try {
        const audioUrl = `/api/download-audio?url=${encodeURIComponent(this.currentVideoUrl)}`;
        
        const link = document.createElement('a');
        link.href = audioUrl;
        link.target = '_blank';
        link.download = 'audio.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('🎵 Audio download started!', 'success');
        await this.updateStats('download');
    } catch (error) {
        this.showNotification('❌ Audio download failed', 'error');
    }
}