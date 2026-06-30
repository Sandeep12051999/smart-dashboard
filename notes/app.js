// Quick Notes App

let notes = [];
let currentNoteId = null;
let saveTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    renderNotesList();

    if (notes.length > 0) {
        selectNote(notes[0].id);
    } else {
        createNewNote();
    }
});

// Load notes from localStorage
function loadNotes() {
    const saved = localStorage.getItem('quickNotes');
    if (saved) {
        notes = JSON.parse(saved);
    }
}

// Save notes to localStorage
function saveNotes() {
    localStorage.setItem('quickNotes', JSON.stringify(notes));
}

// Create new note
function createNewNote() {
    const newNote = {
        id: Date.now(),
        title: 'Untitled Note',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    notes.unshift(newNote);
    saveNotes();
    renderNotesList();
    selectNote(newNote.id);

    // Focus on title
    document.getElementById('noteTitle').focus();
    document.getElementById('noteTitle').select();
}

// Select note
function selectNote(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);

    if (!note) return;

    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    updateCharCount();
    updateLastSaved(note.updatedAt);

    // Update active state in list
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.id) === id) {
            item.classList.add('active');
        }
    });
}

// Auto save
function autoSave() {
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.textContent = 'Saving...';
    saveStatus.classList.add('saving');

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveCurrentNote();
        saveStatus.textContent = 'Saved';
        saveStatus.classList.remove('saving');
    }, 500);

    updateCharCount();
}

// Save current note
function saveCurrentNote() {
    if (!currentNoteId) return;

    const noteIndex = notes.findIndex(n => n.id === currentNoteId);
    if (noteIndex === -1) return;

    const title = document.getElementById('noteTitle').value || 'Untitled Note';
    const content = document.getElementById('noteContent').value;

    notes[noteIndex].title = title;
    notes[noteIndex].content = content;
    notes[noteIndex].updatedAt = new Date().toISOString();

    saveNotes();
    renderNotesList();
    updateLastSaved(notes[noteIndex].updatedAt);
}

// Delete current note
function deleteCurrentNote() {
    if (!currentNoteId) return;

    if (!confirm('Are you sure you want to delete this note?')) return;

    notes = notes.filter(n => n.id !== currentNoteId);
    saveNotes();
    renderNotesList();

    if (notes.length > 0) {
        selectNote(notes[0].id);
    } else {
        currentNoteId = null;
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        createNewNote();
    }
}

// Search notes
function searchNotes() {
    const searchTerm = document.getElementById('searchNotes').value.toLowerCase();
    renderNotesList(searchTerm);
}

// Render notes list
function renderNotesList(filter = '') {
    const container = document.getElementById('notesList');

    let filteredNotes = notes;
    if (filter) {
        filteredNotes = notes.filter(n =>
            n.title.toLowerCase().includes(filter) ||
            n.content.toLowerCase().includes(filter)
        );
    }

    if (filteredNotes.length === 0) {
        container.innerHTML = '<p class="empty-notes">No notes found</p>';
        return;
    }

    container.innerHTML = filteredNotes.map(note => `
        <div class="note-item ${note.id === currentNoteId ? 'active' : ''}"
             data-id="${note.id}"
             onclick="selectNote(${note.id})">
            <h4>${escapeHtml(note.title)}</h4>
            <p>${escapeHtml(getPreview(note.content))}</p>
            <div class="note-date">${formatDate(note.updatedAt)}</div>
        </div>
    `).join('');
}

// Get preview text
function getPreview(content) {
    if (!content) return 'No content';
    return content.substring(0, 50) + (content.length > 50 ? '...' : '');
}

// Update character count
function updateCharCount() {
    const content = document.getElementById('noteContent').value;
    document.getElementById('charCount').textContent = `${content.length} characters`;
}

// Update last saved time
function updateLastSaved(dateStr) {
    const date = new Date(dateStr);
    document.getElementById('lastSaved').textContent = `Last saved: ${formatTime(date)}`;
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
    });
}

// Format time
function formatTime(date) {
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
        document.getElementById('saveStatus').textContent = 'Saved';
    }

    // Ctrl+N for new note
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }
});
