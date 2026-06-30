// Smart Dashboard - Main JavaScript

// App Configuration
const APPS = {
    'english-speaking': {
        name: 'AI English Speaking',
        path: 'english-speaking/index.html',
        available: true
    },
    'expense-tracker': {
        name: 'Expense Tracker',
        path: 'expense-tracker/index.html',
        available: true
    },
    'todo': {
        name: 'Todo List',
        path: 'todo/index.html',
        available: false
    },
    'notes': {
        name: 'Quick Notes',
        path: 'notes/index.html',
        available: true
    },
    'calculator': {
        name: 'Calculator',
        path: 'calculator/index.html',
        available: true
    },
    'pomodoro': {
        name: 'Pomodoro Timer',
        path: 'pomodoro/index.html',
        available: true
    }
};

let currentApp = 'english-speaking';
let isFullscreen = false;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadLastApp();
});

// Setup Navigation Click Events
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const appId = item.dataset.app;
            loadApp(appId);
        });
    });
}

// Load App
function loadApp(appId) {
    const app = APPS[appId];

    if (!app) {
        console.error('App not found:', appId);
        return;
    }

    if (!app.available) {
        alert(`${app.name} is coming soon!`);
        return;
    }

    // Update active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.app === appId) {
            item.classList.add('active');
        }
    });

    // Update breadcrumb
    document.getElementById('currentAppName').textContent = app.name;

    // Load app in iframe
    const iframe = document.getElementById('appFrame');
    const welcomeScreen = document.getElementById('welcomeScreen');

    if (iframe) {
        iframe.style.display = 'block';
        iframe.src = app.path;
    }

    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    // Save current app
    currentApp = appId;
    localStorage.setItem('lastApp', appId);
}

// Load Last Used App
function loadLastApp() {
    const lastApp = localStorage.getItem('lastApp');
    if (lastApp && APPS[lastApp] && APPS[lastApp].available) {
        loadApp(lastApp);
    } else {
        loadApp('english-speaking');
    }
}

// Search/Filter Apps
function filterApps() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        const appName = item.querySelector('.nav-text').textContent.toLowerCase();
        if (appName.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// Toggle Fullscreen
function toggleFullscreen() {
    const dashboard = document.querySelector('.dashboard');

    if (isFullscreen) {
        dashboard.classList.remove('fullscreen');
        isFullscreen = false;
    } else {
        dashboard.classList.add('fullscreen');
        isFullscreen = true;
    }
}

// Open Current App in New Tab
function openInNewTab() {
    const app = APPS[currentApp];
    if (app && app.available) {
        window.open(app.path, '_blank');
    }
}

// Refresh Current App
function refreshApp() {
    const iframe = document.getElementById('appFrame');
    if (iframe) {
        iframe.src = iframe.src;
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to exit fullscreen
    if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
    }

    // Ctrl+K to focus search
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }

    // Ctrl+1-6 to switch apps
    if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const appKeys = Object.keys(APPS);
        const index = parseInt(e.key) - 1;
        if (appKeys[index]) {
            loadApp(appKeys[index]);
        }
    }
});
