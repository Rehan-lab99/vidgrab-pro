// Simple YouTube Downloader - FIXED VERSION
console.log('VidGrab Pro Loaded!');

let currentVideoUrl = '';

// Show notification
function showAlert(message, type = 'info') {
    alert(message); // Simple alert for now
}

// Fetch video info
async function fetchVideoInfo() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const button = document.querySelector('.download-btn');
    
    if (!videoUrl) {
        showAlert('Please enter YouTube URL', 'error');
        return;
    }
    
    if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
        showAlert('Please enter valid YouTube URL', 'error');
        return;
    }
    
    currentVideoUrl = videoUrl;
    
    // Show loading
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    button.disabled = true;
    
    try {
        console.log('Fetching video info...');
        
        const response = await fetch(`/api/video-info?url=${encodeURIComponent(videoUrl)}`);
        const data = await response.json();
        
        console.log('Video info:', data);
        
        if (data.success === false) {
            showAlert('Using demo mode. Actual download may not work.', 'info');
        }
        
        // Display video info
        document.getElementById('thumbnailImg').src = data.thumbnail;
        document.getElementById('videoTitle').textContent = data.title;
        document.getElementById('videoDuration').textContent = data.duration;
        document.getElementById('videoViews').textContent = data.views + ' views';
        document.getElementById('videoAuthor').textContent = data.author;
        
        // Show video section
        document.getElementById('videoInfo').style.display = 'block';
        
        // Scroll to video
        document.getElementById('videoInfo').scrollIntoView({ behavior: 'smooth' });
        
        showAlert('Video info loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to load video info', 'error');
        showDemoData();
    } finally {
        button.innerHTML = '<i class="fas fa-bolt"></i> Grab Video';
        button.disabled = false;
    }
}

// Download video
async function downloadVideo(quality) {
    if (!currentVideoUrl) {
        showAlert('Please enter YouTube URL first', 'error');
        return;
    }
    
    try {
        showAlert(`Starting ${quality} download...`, 'info');
        
        // Open download in new tab
        const downloadUrl = `/api/download?url=${encodeURIComponent(currentVideoUrl)}&quality=${quality}`;
        window.open(downloadUrl, '_blank');
        
        showAlert(`Download started for ${quality}!`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showAlert('Download failed. Try alternative methods.', 'error');
    }
}

// Show demo data
function showDemoData() {
    document.getElementById('thumbnailImg').src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop';
    document.getElementById('videoTitle').textContent = 'YouTube Video - Demo Mode';
    document.getElementById('videoDuration').textContent = '10:30';
    document.getElementById('videoViews').textContent = '1.2M views';
    document.getElementById('videoAuthor').textContent = 'YouTube Channel';
    
    document.getElementById('videoInfo').style.display = 'block';
}

// Download best quality
function downloadBestQuality() {
    downloadVideo('720p');
}

// Admin panel functions
function openAdminPanel() {
    document.getElementById('adminModal').style.display = 'block';
}

function closeAdminPanel() {
    document.getElementById('adminModal').style.display = 'none';
}

function openTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded!');
    
    // Enter key support
    document.getElementById('videoUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchVideoInfo();
        }
    });
    
    // Test API connection
    testAPI();
});

// Test API connection
async function testAPI() {
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        console.log('API test:', data);
    } catch (error) {
        console.log('API test failed:', error);
    }
}
