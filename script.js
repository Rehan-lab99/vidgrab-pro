console.log('✅ Script loaded successfully!');

function fetchVideoInfo() {
    const url = document.getElementById('videoUrl').value;
    const button = document.querySelector('.download-btn');
    
    console.log('Fetching info for:', url);
    
    // Show loading
    button.innerHTML = '⏳ Loading...';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Always show demo data
        document.getElementById('thumbnailImg').src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=250&fit=crop';
        document.getElementById('videoTitle').textContent = 'YouTube Video - ' + (url ? 'Loaded Successfully' : 'Demo');
        document.getElementById('videoDuration').textContent = '8:45';
        document.getElementById('videoViews').textContent = '2.1M views';
        
        // Show video section
        document.getElementById('videoInfo').style.display = 'block';
        
        // Reset button
        button.innerHTML = '⬇️ Grab Video';
        button.disabled = false;
        
        alert('✅ Video info loaded successfully!');
        
    }, 1500);
}

function downloadVideo(quality) {
    alert(`🎬 Download would start in ${quality} quality!\n\nNote: This is a demo. Actual download requires backend setup.`);
    
    // Simulate download
    console.log('Download requested:', quality);
}

function openAdminPanel() {
    document.getElementById('adminModal').style.display = 'block';
}

function closeAdminPanel() {
    document.getElementById('adminModal').style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Website fully loaded!');
    
    // Enter key support
    document.getElementById('videoUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchVideoInfo();
        }
    });
});
