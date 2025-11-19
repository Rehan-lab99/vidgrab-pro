let authToken = '';

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const alert = document.getElementById('loginAlert');

    if (!username || !password) {
        showAlert(alert, 'Please enter both username and password', 'error');
        return;
    }

    authToken = btoa(`${username}:${password}`);

    // Test authentication
    fetch('/api/admin/stats', {
        headers: {
            'Authorization': `Basic ${authToken}`
        }
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
            loadDashboard();
        } else {
            showAlert(alert, 'Invalid credentials', 'error');
        }
    })
    .catch(error => {
        showAlert(alert, 'Login failed', 'error');
    });
}

function logout() {
    authToken = '';
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
}

function openTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from buttons
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');

    // Load tab data
    if (tabName === 'dashboard') loadDashboard();
    if (tabName === 'settings') loadSettings();
    if (tabName === 'blocking') loadBlockedVideos();
}

function loadDashboard() {
    fetch('/api/admin/stats', {
        headers: {
            'Authorization': `Basic ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${data.stats.totalDownloads}</div>
                <div class="stat-label">Total Downloads</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.stats.successfulDownloads}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.stats.failedDownloads}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.rateLimit}</div>
                <div class="stat-label">Active Users</div>
            </div>
        `;
    })
    .catch(error => {
        showAlert(document.getElementById('alert'), 'Failed to load stats', 'error');
    });
}

function loadSettings() {
    fetch('/api/admin/stats', {
        headers: {
            'Authorization': `Basic ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('maxFileSize').value = data.stats.settings?.maxFileSize || 500;
        document.getElementById('rateLimit').value = data.stats.settings?.rateLimit || 10;
        document.getElementById('maintenanceMode').checked = data.stats.settings?.maintenance || false;
    });
}

function loadBlockedVideos() {
    fetch('/api/admin/stats', {
        headers: {
            'Authorization': `Basic ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const list = document.getElementById('blockedVideosList');
        const videos = data.stats.blockedVideos || [];
        
        if (videos.length === 0) {
            list.innerHTML = '<p style="color: #aaa;">No videos blocked</p>';
        } else {
            list.innerHTML = videos.map(videoId => `
                <div style="background: #252525; padding: 10px; margin: 5px 0; border-radius: 4px;">
                    ${videoId}
                </div>
            `).join('');
        }
    });
}

function saveSettings() {
    const settings = {
        maxFileSize: parseInt(document.getElementById('maxFileSize').value),
        rateLimit: parseInt(document.getElementById('rateLimit').value),
        maintenance: document.getElementById('maintenanceMode').checked
    };

    fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authToken}`
        },
        body: JSON.stringify(settings)
    })
    .then(response => response.json())
    .then(data => {
        showAlert(document.getElementById('alert'), 'Settings saved successfully', 'success');
    })
    .catch(error => {
        showAlert(document.getElementById('alert'), 'Failed to save settings', 'error');
    });
}

function blockVideo() {
    const videoId = document.getElementById('videoId').value.trim();
    
    if (!videoId) {
        showAlert(document.getElementById('alert'), 'Please enter video ID', 'error');
        return;
    }

    fetch('/api/admin/block-video', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authToken}`
        },
        body: JSON.stringify({ videoId })
    })
    .then(response => response.json())
    .then(data => {
        showAlert(document.getElementById('alert'), 'Video blocked successfully', 'success');
        document.getElementById('videoId').value = '';
        loadBlockedVideos();
    })
    .catch(error => {
        showAlert(document.getElementById('alert'), 'Failed to block video', 'error');
    });
}

function resetStats() {
    if (!confirm('Are you sure you want to reset all statistics?')) return;

    fetch('/api/admin/reset-stats', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${authToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        showAlert(document.getElementById('alert'), 'Statistics reset successfully', 'success');
        loadDashboard();
    })
    .catch(error => {
        showAlert(document.getElementById('alert'), 'Failed to reset statistics', 'error');
    });
}

function showAlert(element, message, type) {
    element.textContent = message;
    element.className = `alert ${type}`;
    element.classList.remove('hidden');
    
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

// Auto-login if token exists (for development)
// Remove this in production
if (window.location.hash === '#dev') {
    authToken = btoa('admin:admin123');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadDashboard();
}
