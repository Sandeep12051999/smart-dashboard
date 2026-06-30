// Pomodoro Timer App - Database Connected

const API_BASE = 'http://localhost:5500/api';

// Default settings
const DEFAULT_SETTINGS = {
    work_duration: 25,
    short_break: 5,
    long_break: 15,
    long_break_after: 4,
    auto_start_breaks: false,
    auto_start_pomodoros: false,
    sound_enabled: true,
    browser_notifications: true
};

// State
let settings = { ...DEFAULT_SETTINGS };
let currentMode = 'work';
let timeRemaining = settings.work_duration * 60;
let totalTime = settings.work_duration * 60;
let isRunning = false;
let timerInterval = null;
let pomodorosInSession = 0;
let todayStats = { pomodoros_completed: 0, focus_time: 0, tasks_completed: 0 };
let tasks = [];
let activeTaskId = null;
let estimatedPomodoros = 1;

const MODE_CONFIG = {
    work: { label: 'Focus Time', gradient: 'linear-gradient(135deg, #f85149, #f7931a)' },
    shortBreak: { label: 'Short Break', gradient: 'linear-gradient(135deg, #3fb950, #2ea043)' },
    longBreak: { label: 'Long Break', gradient: 'linear-gradient(135deg, #58a6ff, #388bfd)' }
};

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Check authentication
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

// API helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '../login.html';
        throw new Error('Unauthorized');
    }

    return response;
}

// Update sync status
function updateSyncStatus(status) {
    const syncEl = document.getElementById('syncStatus');
    if (!syncEl) return;

    const icons = { syncing: '🔄', synced: '☁️', error: '⚠️' };
    const texts = { syncing: 'Syncing...', synced: 'Synced', error: 'Sync Error' };

    syncEl.className = `sync-status ${status}`;
    syncEl.innerHTML = `
        <span class="sync-icon">${icons[status]}</span>
        <span class="sync-text">${texts[status]}</span>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }

    await loadSettings();
    await loadTodayStats();
    await loadTasks();
    await loadWeeklyStats();

    updateDisplay();
    updateProgress();
    updateSessionInfo();

    document.addEventListener('keydown', handleKeyboard);
});

// Load settings from database
async function loadSettings() {
    updateSyncStatus('syncing');
    try {
        const response = await apiRequest('/pomodoro/settings');
        if (response.ok) {
            const data = await response.json();
            settings = { ...DEFAULT_SETTINGS, ...data.settings };
            timeRemaining = settings.work_duration * 60;
            totalTime = timeRemaining;
            updateSettingsUI();
        }
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Load settings error:', error);
        updateSyncStatus('error');
    }
}

// Save settings to database
async function saveSettings() {
    const newSettings = {
        work_duration: parseInt(document.getElementById('settingWork').value) || 25,
        short_break: parseInt(document.getElementById('settingShortBreak').value) || 5,
        long_break: parseInt(document.getElementById('settingLongBreak').value) || 15,
        long_break_after: parseInt(document.getElementById('settingLongBreakAfter').value) || 4,
        auto_start_breaks: document.getElementById('settingAutoBreak').checked,
        auto_start_pomodoros: document.getElementById('settingAutoPomodoro').checked,
        sound_enabled: document.getElementById('settingSound').checked,
        browser_notifications: document.getElementById('settingBrowser').checked
    };

    updateSyncStatus('syncing');
    try {
        const response = await apiRequest('/pomodoro/settings', {
            method: 'PUT',
            body: JSON.stringify(newSettings)
        });

        if (response.ok) {
            settings = newSettings;

            // Update timer if not running
            if (!isRunning) {
                timeRemaining = settings[currentMode === 'work' ? 'work_duration' : currentMode === 'shortBreak' ? 'short_break' : 'long_break'] * 60;
                totalTime = timeRemaining;
                updateDisplay();
                updateProgress();
            }

            updateSyncStatus('synced');
            closeSettingsModal();
        } else {
            updateSyncStatus('error');
        }
    } catch (error) {
        console.error('Save settings error:', error);
        updateSyncStatus('error');
    }
}

// Update settings UI
function updateSettingsUI() {
    document.getElementById('settingWork').value = settings.work_duration;
    document.getElementById('settingShortBreak').value = settings.short_break;
    document.getElementById('settingLongBreak').value = settings.long_break;
    document.getElementById('settingLongBreakAfter').value = settings.long_break_after;
    document.getElementById('settingAutoBreak').checked = settings.auto_start_breaks;
    document.getElementById('settingAutoPomodoro').checked = settings.auto_start_pomodoros;
    document.getElementById('settingSound').checked = settings.sound_enabled;
    document.getElementById('settingBrowser').checked = settings.browser_notifications;
}

// Load today's stats
async function loadTodayStats() {
    try {
        const response = await apiRequest('/pomodoro/stats/today');
        if (response.ok) {
            const data = await response.json();
            todayStats = data.stats;
            updateSessionInfo();
        }
    } catch (error) {
        console.error('Load today stats error:', error);
    }
}

// Load weekly stats
async function loadWeeklyStats() {
    try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);

        const from = weekStart.toISOString().split('T')[0];
        const to = today.toISOString().split('T')[0];

        const response = await apiRequest(`/pomodoro/stats?from=${from}&to=${to}`);
        if (response.ok) {
            const data = await response.json();
            renderWeeklyStats(data.stats);
        }
    } catch (error) {
        console.error('Load weekly stats error:', error);
    }
}

// Render weekly stats
function renderWeeklyStats(stats) {
    const container = document.getElementById('weeklyStats');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    // Create stats map
    const statsMap = {};
    stats.forEach(s => {
        statsMap[s.date] = s;
    });

    let html = '';
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayStats = statsMap[dateStr] || { pomodoros_completed: 0, focus_time: 0 };
        const isToday = i === 0;

        const hours = Math.floor(dayStats.focus_time / 60);
        const mins = dayStats.focus_time % 60;
        const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        html += `
            <div class="stat-day ${isToday ? 'today' : ''}">
                <div class="stat-day-name">${days[date.getDay()]}</div>
                <div class="stat-day-value">${dayStats.pomodoros_completed}</div>
                <div class="stat-day-time">${timeStr}</div>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Load tasks
async function loadTasks() {
    try {
        const response = await apiRequest('/pomodoro/tasks');
        if (response.ok) {
            const data = await response.json();
            tasks = data.tasks;
            renderTasks();
        }
    } catch (error) {
        console.error('Load tasks error:', error);
    }
}

// Render tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const completedList = document.getElementById('completedList');

    const pendingTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    // Render pending tasks
    if (pendingTasks.length === 0) {
        taskList.innerHTML = '<p class="no-tasks">No tasks yet. Add one to get started!</p>';
    } else {
        taskList.innerHTML = pendingTasks.map(task => `
            <div class="task-item ${task.id === activeTaskId ? 'selected' : ''}" data-id="${task.id}">
                <div class="task-checkbox" onclick="toggleTaskComplete(${task.id})"></div>
                <div class="task-content" onclick="selectTask(${task.id})">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-meta">${task.pomodoros_spent}/${task.estimated_pomodoros} 🍅</div>
                </div>
                <div class="task-actions">
                    <button class="btn-task-action btn-select" onclick="selectTask(${task.id})" title="Work on this">▶</button>
                    <button class="btn-task-action" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    // Render completed tasks
    document.getElementById('completedCount').textContent = completedTasks.length;
    completedList.innerHTML = completedTasks.map(task => `
        <div class="task-item completed" data-id="${task.id}">
            <div class="task-checkbox" onclick="toggleTaskComplete(${task.id})">✓</div>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">${task.pomodoros_spent} 🍅 completed</div>
            </div>
            <div class="task-actions">
                <button class="btn-task-action" onclick="deleteTask(${task.id})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');

    // Update active task section
    updateActiveTaskDisplay();
}

// Update active task display
function updateActiveTaskDisplay() {
    const section = document.getElementById('activeTaskSection');
    const container = document.getElementById('activeTask');

    const activeTask = tasks.find(t => t.id === activeTaskId && !t.completed);

    if (activeTask) {
        section.style.display = 'block';

        const dots = Array(activeTask.estimated_pomodoros).fill(0).map((_, i) =>
            `<div class="pomodoro-dot ${i < activeTask.pomodoros_spent ? 'filled' : ''}"></div>`
        ).join('');

        container.innerHTML = `
            <div class="task-title">${escapeHtml(activeTask.title)}</div>
            <div class="task-progress">
                <div class="pomodoro-dots">${dots}</div>
                <span>${activeTask.pomodoros_spent}/${activeTask.estimated_pomodoros}</span>
            </div>
        `;
    } else {
        section.style.display = 'none';
        activeTaskId = null;
    }
}

// Select task
function selectTask(id) {
    activeTaskId = id;
    renderTasks();
}

// Toggle task complete
async function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    updateSyncStatus('syncing');
    try {
        const response = await apiRequest(`/pomodoro/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ completed: !task.completed })
        });

        if (response.ok) {
            task.completed = !task.completed;
            if (task.completed && task.id === activeTaskId) {
                activeTaskId = null;
            }
            renderTasks();
            await loadTodayStats();
            updateSyncStatus('synced');
        } else {
            updateSyncStatus('error');
        }
    } catch (error) {
        console.error('Toggle task error:', error);
        updateSyncStatus('error');
    }
}

// Delete task
async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;

    updateSyncStatus('syncing');
    try {
        const response = await apiRequest(`/pomodoro/tasks/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            tasks = tasks.filter(t => t.id !== id);
            if (id === activeTaskId) activeTaskId = null;
            renderTasks();
            updateSyncStatus('synced');
        } else {
            updateSyncStatus('error');
        }
    } catch (error) {
        console.error('Delete task error:', error);
        updateSyncStatus('error');
    }
}

// Add task
async function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) {
        alert('Please enter a task name');
        return;
    }

    updateSyncStatus('syncing');
    try {
        const response = await apiRequest('/pomodoro/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title,
                estimated_pomodoros: estimatedPomodoros
            })
        });

        if (response.ok) {
            const data = await response.json();
            tasks.unshift(data.task);
            renderTasks();
            closeTaskModal();
            updateSyncStatus('synced');
        } else {
            updateSyncStatus('error');
        }
    } catch (error) {
        console.error('Add task error:', error);
        updateSyncStatus('error');
    }
}

// Set timer mode
function setMode(mode) {
    if (isRunning) {
        if (!confirm('Timer is running. Switch mode?')) return;
        stopTimer();
    }

    currentMode = mode;
    const duration = mode === 'work' ? settings.work_duration :
                     mode === 'shortBreak' ? settings.short_break : settings.long_break;
    timeRemaining = duration * 60;
    totalTime = timeRemaining;

    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    document.getElementById('modeLabel').textContent = MODE_CONFIG[mode].label;
    updateDisplay();
    updateProgress();
}

// Toggle timer
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

// Start timer
function startTimer() {
    isRunning = true;
    updateStartButton();

    timerInterval = setInterval(() => {
        timeRemaining--;

        if (timeRemaining <= 0) {
            completeTimer();
        } else {
            updateDisplay();
            updateProgress();
        }
    }, 1000);
}

// Pause timer
function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    updateStartButton();
}

// Stop timer
function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    updateStartButton();
}

// Reset timer
function resetTimer() {
    stopTimer();
    const duration = currentMode === 'work' ? settings.work_duration :
                     currentMode === 'shortBreak' ? settings.short_break : settings.long_break;
    timeRemaining = duration * 60;
    totalTime = timeRemaining;
    updateDisplay();
    updateProgress();
}

// Skip timer
function skipTimer() {
    if (!confirm('Skip this session?')) return;
    stopTimer();
    switchMode();
}

// Complete timer
async function completeTimer() {
    stopTimer();

    if (settings.sound_enabled) {
        playNotification();
    }

    if (currentMode === 'work') {
        pomodorosInSession++;

        // Record pomodoro completion
        updateSyncStatus('syncing');
        try {
            await apiRequest('/pomodoro/stats/pomodoro', {
                method: 'POST',
                body: JSON.stringify({ focus_time: settings.work_duration })
            });

            // Update task if active
            if (activeTaskId) {
                await apiRequest(`/pomodoro/tasks/${activeTaskId}/pomodoro`, {
                    method: 'POST'
                });
                const task = tasks.find(t => t.id === activeTaskId);
                if (task) task.pomodoros_spent++;
                renderTasks();
            }

            await loadTodayStats();
            await loadWeeklyStats();
            updateSyncStatus('synced');
        } catch (error) {
            console.error('Record pomodoro error:', error);
            updateSyncStatus('error');
        }

        // Show notification
        showBrowserNotification('Pomodoro Complete!', 'Time for a break. Great work! 🎉');

        // Switch to break
        if (settings.auto_start_breaks) {
            switchMode();
            startTimer();
        } else {
            switchMode();
        }
    } else {
        // Break completed
        showBrowserNotification('Break Over!', 'Ready to focus again? 💪');

        if (settings.auto_start_pomodoros) {
            setMode('work');
            startTimer();
        } else {
            setMode('work');
        }
    }
}

// Switch mode after completion
function switchMode() {
    if (currentMode === 'work') {
        if (pomodorosInSession % settings.long_break_after === 0) {
            setMode('longBreak');
        } else {
            setMode('shortBreak');
        }
    } else {
        setMode('work');
    }
}

// Update display
function updateDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timerDisplay').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update page title
    document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - Pomodoro`;
}

// Update progress ring
function updateProgress() {
    const circle = document.getElementById('progressRing');
    const circumference = 2 * Math.PI * 130;
    const progress = timeRemaining / totalTime;
    const offset = circumference * (1 - progress);

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
}

// Update start button
function updateStartButton() {
    const btn = document.getElementById('startBtn');
    const icon = document.getElementById('startIcon');
    const text = document.getElementById('startText');

    icon.textContent = isRunning ? '⏸' : '▶';
    text.textContent = isRunning ? 'Pause' : 'Start';
    btn.classList.toggle('running', isRunning);
}

// Update session info
function updateSessionInfo() {
    document.getElementById('todayPomodoros').textContent = todayStats.pomodoros_completed;

    const hours = Math.floor(todayStats.focus_time / 60);
    const mins = todayStats.focus_time % 60;
    document.getElementById('todayFocusTime').textContent =
        hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    document.getElementById('currentStreak').textContent = pomodorosInSession;
}

// Play notification sound
function playNotification() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Show browser notification
function showBrowserNotification(title, body) {
    if (settings.browser_notifications && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '🍅' });
    }
}

// Modal functions
function openSettingsModal() {
    updateSettingsUI();
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('show');
}

function openTaskModal() {
    document.getElementById('taskTitle').value = '';
    estimatedPomodoros = 1;
    document.getElementById('estimatedPomodoros').textContent = estimatedPomodoros;
    document.getElementById('estimatedTime').textContent = estimatedPomodoros * settings.work_duration;
    document.getElementById('taskModal').classList.add('show');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('show');
}

function adjustEstimate(delta) {
    estimatedPomodoros = Math.max(1, Math.min(10, estimatedPomodoros + delta));
    document.getElementById('estimatedPomodoros').textContent = estimatedPomodoros;
    document.getElementById('estimatedTime').textContent = estimatedPomodoros * settings.work_duration;
}

function toggleCompletedTasks() {
    const list = document.getElementById('completedList');
    const icon = document.getElementById('completedToggleIcon');
    const isHidden = list.style.display === 'none';

    list.style.display = isHidden ? 'block' : 'none';
    icon.textContent = isHidden ? '▲' : '▼';
}

// Keyboard shortcuts
function handleKeyboard(e) {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
    } else if (e.key === 'r' || e.key === 'R') {
        resetTimer();
    } else if (e.key === 's' || e.key === 'S') {
        skipTimer();
    }
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
};

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
