// Pomodoro Timer App

const MODES = {
    work: { duration: 25, label: 'Focus Time', color: '#f85149' },
    shortBreak: { duration: 5, label: 'Short Break', color: '#3fb950' },
    longBreak: { duration: 15, label: 'Long Break', color: '#58a6ff' }
};

let currentMode = 'work';
let timeRemaining = MODES.work.duration * 60;
let totalTime = MODES.work.duration * 60;
let isRunning = false;
let timerInterval = null;
let sessionsCompleted = 0;
let totalFocusTime = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    updateDisplay();
    updateProgress();
    updateStats();

    // Add SVG gradient
    addSVGGradient();
});

// Add SVG gradient for progress ring
function addSVGGradient() {
    const svg = document.querySelector('.progress-ring');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#f85149"/>
            <stop offset="100%" style="stop-color:#f7931a"/>
        </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
}

// Set timer mode
function setMode(mode) {
    if (isRunning) {
        if (!confirm('Timer is running. Switch mode?')) return;
        stopTimer();
    }

    currentMode = mode;
    timeRemaining = MODES[mode].duration * 60;
    totalTime = timeRemaining;

    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });

    document.getElementById('modeLabel').textContent = MODES[mode].label;
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
    timeRemaining = MODES[currentMode].duration * 60;
    totalTime = timeRemaining;
    updateDisplay();
    updateProgress();
}

// Complete timer
function completeTimer() {
    stopTimer();
    playNotification();

    if (currentMode === 'work') {
        sessionsCompleted++;
        totalFocusTime += MODES.work.duration;
        saveStats();
        updateStats();

        // Auto switch to break
        if (sessionsCompleted % 4 === 0) {
            setMode('longBreak');
        } else {
            setMode('shortBreak');
        }
    } else {
        setMode('work');
    }

    // Show notification
    if (Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', {
            body: currentMode === 'work' ? 'Time to focus!' : 'Break time over!',
            icon: '🍅'
        });
    }
}

// Update display
function updateDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timerDisplay').textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update progress ring
function updateProgress() {
    const circle = document.getElementById('progressRing');
    const circumference = 2 * Math.PI * 140; // r = 140
    const progress = timeRemaining / totalTime;
    const offset = circumference * (1 - progress);

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
}

// Update start button
function updateStartButton() {
    document.getElementById('startIcon').textContent = isRunning ? '⏸' : '▶';
    document.getElementById('startText').textContent = isRunning ? 'Pause' : 'Start';
}

// Adjust time settings
function adjustTime(mode, change) {
    MODES[mode].duration = Math.max(1, MODES[mode].duration + change);
    document.getElementById(`${mode}Duration`).textContent = MODES[mode].duration;

    if (currentMode === mode && !isRunning) {
        timeRemaining = MODES[mode].duration * 60;
        totalTime = timeRemaining;
        updateDisplay();
        updateProgress();
    }
}

// Play notification sound
function playNotification() {
    // Create a simple beep
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, 200);
}

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('pomodoroStats');
    if (saved) {
        const stats = JSON.parse(saved);
        sessionsCompleted = stats.sessions || 0;
        totalFocusTime = stats.totalTime || 0;
    }

    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify({
        sessions: sessionsCompleted,
        totalTime: totalFocusTime
    }));
}

// Update stats display
function updateStats() {
    document.getElementById('sessionCount').textContent = sessionsCompleted;

    const hours = Math.floor(totalFocusTime / 60);
    const mins = totalFocusTime % 60;
    document.getElementById('totalTime').textContent =
        hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
    } else if (e.key === 'r' || e.key === 'R') {
        resetTimer();
    }
});
