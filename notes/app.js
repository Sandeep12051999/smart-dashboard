// Quick Notes App - Database First Architecture

const API_URL = 'http://localhost:5500/api';

// Predefined colors for tags
const TAG_COLORS = [
    { name: 'Red', color: '#f85149' },
    { name: 'Orange', color: '#f7931a' },
    { name: 'Yellow', color: '#d29922' },
    { name: 'Green', color: '#3fb950' },
    { name: 'Teal', color: '#2ea043' },
    { name: 'Blue', color: '#58a6ff' },
    { name: 'Indigo', color: '#6e7bff' },
    { name: 'Purple', color: '#a371f7' },
    { name: 'Pink', color: '#f778ba' },
    { name: 'Gray', color: '#8b949e' }
];

// State
let notes = [];
let allTags = [];
let currentNoteId = null;
let currentNoteTags = [];
let saveTimeout = null;
let currentFilter = 'all';
let currentTagFilter = null;
let selectedNewTagColor = TAG_COLORS[5].color;
let isManageTagsMode = false;
let tagToDelete = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    renderColorOptions();
    setupOutsideClickHandler();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    // Load data from server
    loadData();
}

// Get auth headers
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// Load all data from server
async function loadData() {
    updateSyncStatus('syncing');
    try {
        await Promise.all([loadTags(), loadNotes()]);
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Load data error:', error);
        updateSyncStatus('error');
    }
}

// ============ API FUNCTIONS ============

async function loadTags() {
    const response = await fetch(`${API_URL}/tags`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to load tags');

    const data = await response.json();
    allTags = data.tags || [];
    renderTagsFilter();
}

async function loadNotes() {
    const response = await fetch(`${API_URL}/notes`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to load notes');

    const data = await response.json();
    notes = data.notes || [];
    renderNotesList();
    showEmptyState();
}

async function createNote() {
    const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            title: 'Untitled Note',
            content: '',
            pinned: false,
            tags: []
        })
    });

    if (!response.ok) throw new Error('Failed to create note');

    const data = await response.json();
    return data.note;
}

async function updateNote(id, noteData) {
    const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(noteData)
    });

    if (!response.ok) throw new Error('Failed to update note');

    const data = await response.json();
    return data.note;
}

async function deleteNote(id) {
    const response = await fetch(`${API_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete note');
}

async function createTag(name, color) {
    const response = await fetch(`${API_URL}/tags`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, color })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create tag');
    }

    const data = await response.json();
    return data.tag;
}

async function deleteTag(id) {
    const response = await fetch(`${API_URL}/tags/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to delete tag');
}

// ============ NOTE OPERATIONS ============

async function createNewNote() {
    try {
        updateSyncStatus('syncing');

        const note = await createNote();
        notes.unshift({ ...note, tags: [] });

        renderNotesList();
        selectNote(note.id);
        updateSyncStatus('synced');

        setTimeout(() => {
            document.getElementById('noteTitle').focus();
            document.getElementById('noteTitle').select();
        }, 100);
    } catch (error) {
        console.error('Create note error:', error);
        updateSyncStatus('error');
        alert('Failed to create note. Please try again.');
    }
}

function selectNote(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);

    if (!note) return;

    hideEmptyState();
    closeTagDropdown();

    document.getElementById('noteTitle').value = note.title || '';
    document.getElementById('noteContent').value = note.content || '';
    currentNoteTags = note.tags ? [...note.tags] : [];

    updateCharCount();
    updateWordCount();
    updateLastSaved(note.updated_at);
    updatePinButton(note.pinned);
    renderNoteTags();

    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === String(id)) {
            item.classList.add('active');
        }
    });

    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

function closeNote() {
    if (currentNoteId) {
        saveCurrentNote();
    }

    currentNoteId = null;
    currentNoteTags = [];
    closeTagDropdown();

    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
    });

    showEmptyState();
}

function autoSave() {
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.textContent = 'Saving...';
    saveStatus.classList.add('saving');

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveCurrentNote();
    }, 800);

    updateCharCount();
    updateWordCount();
}

async function saveCurrentNote() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    const title = document.getElementById('noteTitle').value || 'Untitled Note';
    const content = document.getElementById('noteContent').value;

    try {
        updateSyncStatus('syncing');

        const updatedNote = await updateNote(currentNoteId, {
            title,
            content,
            pinned: note.pinned,
            tags: currentNoteTags
        });

        // Update local state
        note.title = title;
        note.content = content;
        note.tags = [...currentNoteTags];
        note.updated_at = updatedNote.updated_at;

        renderNotesList();
        updateLastSaved(note.updated_at);

        document.getElementById('saveStatus').textContent = 'Saved';
        document.getElementById('saveStatus').classList.remove('saving');
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Save note error:', error);
        document.getElementById('saveStatus').textContent = 'Error';
        updateSyncStatus('error');
    }
}

async function deleteCurrentNote() {
    if (!currentNoteId) return;

    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        updateSyncStatus('syncing');
        await deleteNote(currentNoteId);

        notes = notes.filter(n => n.id !== currentNoteId);
        renderNotesList();

        currentNoteId = null;
        currentNoteTags = [];
        showEmptyState();
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Delete note error:', error);
        updateSyncStatus('error');
        alert('Failed to delete note. Please try again.');
    }
}

async function togglePin() {
    if (!currentNoteId) return;

    const note = notes.find(n => n.id === currentNoteId);
    if (!note) return;

    const newPinned = !note.pinned;

    try {
        updateSyncStatus('syncing');

        await updateNote(currentNoteId, {
            title: note.title,
            content: note.content,
            pinned: newPinned,
            tags: note.tags
        });

        note.pinned = newPinned;
        updatePinButton(newPinned);

        // Re-sort notes
        notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.updated_at) - new Date(a.updated_at);
        });

        renderNotesList();
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Toggle pin error:', error);
        updateSyncStatus('error');
    }
}

// ============ TAG OPERATIONS ============

function renderTagsFilter() {
    const container = document.getElementById('tagsFilterList');

    if (allTags.length === 0) {
        container.innerHTML = '<span class="no-tags-sidebar">No tags created</span>';
        container.classList.remove('manage-mode');
        return;
    }

    if (isManageTagsMode) {
        container.classList.add('manage-mode');
    } else {
        container.classList.remove('manage-mode');
    }

    container.innerHTML = allTags.map(tag => `
        <span class="tag-filter-item ${currentTagFilter === tag.name ? 'active' : ''}"
              data-tag-id="${tag.id}"
              onclick="${isManageTagsMode ? `showDeleteTagModal('${escapeHtml(tag.name)}', ${tag.id})` : `filterByTag('${escapeHtml(tag.name)}')`}">
            <span class="tag-color-dot" style="background: ${tag.color}"></span>
            ${escapeHtml(tag.name)}
            <span class="tag-delete">✕</span>
        </span>
    `).join('');
}

function toggleManageTagsMode() {
    isManageTagsMode = !isManageTagsMode;
    const btn = document.getElementById('btnManageTags');
    const hint = document.getElementById('manageTagsHint');

    if (isManageTagsMode) {
        btn.classList.add('active');
        hint.style.display = 'block';
        currentTagFilter = null;
    } else {
        btn.classList.remove('active');
        hint.style.display = 'none';
    }

    renderTagsFilter();
    renderNotesList();
}

function filterByTag(tagName) {
    if (isManageTagsMode) return;

    currentTagFilter = currentTagFilter === tagName ? null : tagName;
    renderTagsFilter();
    renderNotesList();
}

// Delete Tag Modal
function showDeleteTagModal(tagName, tagId) {
    tagToDelete = { name: tagName, id: tagId };
    document.getElementById('deleteTagName').textContent = tagName;
    document.getElementById('deleteTagModal').style.display = 'flex';
}

function closeDeleteTagModal() {
    tagToDelete = null;
    document.getElementById('deleteTagModal').style.display = 'none';
}

async function confirmDeleteTag() {
    if (!tagToDelete) return;

    try {
        updateSyncStatus('syncing');
        await deleteTag(tagToDelete.id);

        // Remove from local state
        allTags = allTags.filter(t => t.id !== tagToDelete.id);

        // Remove from notes in local state
        notes.forEach(note => {
            if (note.tags) {
                note.tags = note.tags.filter(t => t !== tagToDelete.name);
            }
        });

        // Remove from current note tags
        if (currentNoteTags.includes(tagToDelete.name)) {
            currentNoteTags = currentNoteTags.filter(t => t !== tagToDelete.name);
            renderNoteTags();
        }

        if (currentTagFilter === tagToDelete.name) {
            currentTagFilter = null;
        }

        closeDeleteTagModal();
        renderTagsFilter();
        renderNotesList();
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Delete tag error:', error);
        updateSyncStatus('error');
        alert('Failed to delete tag. Please try again.');
    }
}

// Tag Dropdown
function toggleTagDropdown() {
    const dropdown = document.getElementById('tagDropdown');
    const isVisible = dropdown.classList.contains('show');

    if (isVisible) {
        closeTagDropdown();
    } else {
        dropdown.classList.add('show');
        document.getElementById('tagSearchInput').value = '';
        document.getElementById('tagSearchInput').focus();
        renderTagDropdownList();
        hideNewTagForm();
    }
}

function closeTagDropdown() {
    document.getElementById('tagDropdown').classList.remove('show');
}

function setupOutsideClickHandler() {
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('tagDropdown');
        const wrapper = document.querySelector('.tag-dropdown-wrapper');
        const newTagForm = document.getElementById('newTagForm');

        if (dropdown && dropdown.classList.contains('show')) {
            // Don't close if clicking inside the dropdown or wrapper
            if (wrapper && wrapper.contains(e.target)) {
                return;
            }
            // Don't close if new tag form is visible
            if (newTagForm && newTagForm.style.display !== 'none') {
                return;
            }
            closeTagDropdown();
        }
    });
}

function filterTagList() {
    renderTagDropdownList();
}

function renderTagDropdownList() {
    const container = document.getElementById('tagDropdownList');
    const searchTerm = document.getElementById('tagSearchInput').value.toLowerCase();

    let filteredTags = allTags;
    if (searchTerm) {
        filteredTags = allTags.filter(tag => tag.name.toLowerCase().includes(searchTerm));
    }

    if (filteredTags.length === 0 && allTags.length === 0) {
        container.innerHTML = '<div class="no-tags-message">No tags yet. Create one!</div>';
        return;
    }

    if (filteredTags.length === 0) {
        container.innerHTML = '<div class="no-tags-message">No matching tags</div>';
        return;
    }

    container.innerHTML = filteredTags.map(tag => {
        const isSelected = currentNoteTags.includes(tag.name);
        return `
            <div class="tag-dropdown-item ${isSelected ? 'selected' : ''}" onclick="toggleTagSelection('${escapeHtml(tag.name)}')">
                <span class="tag-color-dot" style="background: ${tag.color}"></span>
                <span>${escapeHtml(tag.name)}</span>
                ${isSelected ? '<span class="tag-check">✓</span>' : ''}
            </div>
        `;
    }).join('');
}

function toggleTagSelection(tagName) {
    if (currentNoteTags.includes(tagName)) {
        currentNoteTags = currentNoteTags.filter(t => t !== tagName);
    } else {
        currentNoteTags.push(tagName);
    }

    renderNoteTags();
    renderTagDropdownList();
    saveCurrentNote();
}

function showNewTagForm() {
    document.getElementById('tagDropdownList').style.display = 'none';
    document.querySelector('.tag-dropdown-header').style.display = 'none';
    document.querySelector('.tag-dropdown-footer').style.display = 'none';
    document.getElementById('newTagForm').style.display = 'block';
    document.getElementById('newTagName').value = '';
    document.getElementById('newTagName').focus();

    selectedNewTagColor = TAG_COLORS[5].color;
    renderColorOptions();
}

function hideNewTagForm() {
    document.getElementById('newTagForm').style.display = 'none';
    document.getElementById('tagDropdownList').style.display = 'block';
    document.querySelector('.tag-dropdown-header').style.display = 'block';
    document.querySelector('.tag-dropdown-footer').style.display = 'block';
}

function renderColorOptions() {
    const container = document.getElementById('colorOptions');
    container.innerHTML = TAG_COLORS.map(c => `
        <div class="color-option ${selectedNewTagColor === c.color ? 'selected' : ''}"
             style="background: ${c.color}"
             title="${c.name}"
             data-color="${c.color}">
        </div>
    `).join('');

    // Add click handlers after rendering
    container.querySelectorAll('.color-option').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTagColor(el.dataset.color);
        });
    });
}

function selectTagColor(color) {
    selectedNewTagColor = color;
    // Update UI without re-rendering
    document.querySelectorAll('.color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === color);
    });
}

async function createNewTag() {
    const nameInput = document.getElementById('newTagName');
    const name = nameInput.value.trim();

    if (!name) {
        nameInput.focus();
        return;
    }

    if (allTags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        alert('Tag already exists!');
        return;
    }

    try {
        updateSyncStatus('syncing');
        const newTag = await createTag(name, selectedNewTagColor);
        allTags.push(newTag);

        // Auto-add to current note if a note is selected
        if (currentNoteId && !currentNoteTags.includes(name)) {
            currentNoteTags.push(name);
            renderNoteTags();
            saveCurrentNote();
        }

        hideNewTagForm();
        renderTagDropdownList();
        renderTagsFilter();
        updateSyncStatus('synced');
    } catch (error) {
        console.error('Create tag error:', error);
        updateSyncStatus('error');
        alert(error.message || 'Failed to create tag');
    }
}

function getTagColor(tagName) {
    const tag = allTags.find(t => t.name === tagName);
    return tag ? tag.color : '#8b949e';
}

function removeTagFromNote(tagName) {
    currentNoteTags = currentNoteTags.filter(t => t !== tagName);
    renderNoteTags();
    saveCurrentNote();
}

function renderNoteTags() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = currentNoteTags.map(tagName => {
        const color = getTagColor(tagName);
        return `
            <span class="tag-item" style="background: ${color}">
                ${escapeHtml(tagName)}
                <span class="tag-remove" onclick="removeTagFromNote('${escapeHtml(tagName)}')">&times;</span>
            </span>
        `;
    }).join('');
}

// ============ UI FUNCTIONS ============

function searchNotes() {
    const searchTerm = document.getElementById('searchNotes').value;
    const clearBtn = document.getElementById('clearSearch');

    clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';
    renderNotesList(searchTerm.toLowerCase());
}

function clearSearch() {
    document.getElementById('searchNotes').value = '';
    document.getElementById('clearSearch').style.display = 'none';
    renderNotesList();
}

function filterNotes(filter) {
    currentFilter = filter;
    currentTagFilter = null;

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });

    renderTagsFilter();
    renderNotesList();
}

function renderNotesList(searchTerm = '') {
    const container = document.getElementById('notesList');

    let filteredNotes = [...notes];

    if (currentFilter === 'pinned') {
        filteredNotes = filteredNotes.filter(n => n.pinned);
    }

    if (currentTagFilter) {
        filteredNotes = filteredNotes.filter(n => n.tags && n.tags.includes(currentTagFilter));
    }

    if (searchTerm) {
        filteredNotes = filteredNotes.filter(n =>
            (n.title || '').toLowerCase().includes(searchTerm) ||
            (n.content || '').toLowerCase().includes(searchTerm) ||
            (n.tags && n.tags.some(t => t.toLowerCase().includes(searchTerm)))
        );
    }

    document.getElementById('notesCount').textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;

    if (filteredNotes.length === 0) {
        container.innerHTML = `
            <div class="empty-notes">
                <p>No notes found</p>
                ${searchTerm || currentTagFilter ? '<button class="btn-clear-filter" onclick="clearAllFilters()">Clear filters</button>' : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = filteredNotes.map(note => `
        <div class="note-item ${note.id === currentNoteId ? 'active' : ''} ${note.pinned ? 'pinned' : ''}"
             data-id="${note.id}"
             onclick="selectNote(${note.id})">
            <h4>${escapeHtml(note.title || 'Untitled Note')}</h4>
            <p>${escapeHtml(getPreview(note.content))}</p>
            <div class="note-meta">
                <span class="note-date">${formatDate(note.updated_at)}</span>
                ${note.tags && note.tags.length > 0 ? `
                    <div class="note-tags">
                        ${note.tags.slice(0, 2).map(tagName => {
                            const color = getTagColor(tagName);
                            return `<span class="tag" style="background: ${color}">${escapeHtml(tagName)}</span>`;
                        }).join('')}
                        ${note.tags.length > 2 ? `<span class="tag" style="background: #8b949e">+${note.tags.length - 2}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function clearAllFilters() {
    currentFilter = 'all';
    currentTagFilter = null;
    document.getElementById('searchNotes').value = '';
    document.getElementById('clearSearch').style.display = 'none';

    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === 'all');
    });

    renderTagsFilter();
    renderNotesList();
}

function showEmptyState() {
    document.getElementById('noteEditor').style.display = 'none';
    document.getElementById('emptyState').style.display = 'flex';
}

function hideEmptyState() {
    document.getElementById('noteEditor').style.display = 'flex';
    document.getElementById('emptyState').style.display = 'none';
}

function toggleSidebar() {
    document.getElementById('notesSidebar').classList.toggle('show');
}

function updatePinButton(isPinned) {
    const btn = document.getElementById('btnPin');
    btn.classList.toggle('pinned', isPinned);
}

function updateSyncStatus(status) {
    const syncEl = document.getElementById('syncStatus');
    const iconEl = syncEl.querySelector('.sync-icon');
    const textEl = syncEl.querySelector('.sync-text');

    syncEl.classList.remove('syncing', 'error');

    switch (status) {
        case 'syncing':
            syncEl.classList.add('syncing');
            iconEl.textContent = '🔄';
            textEl.textContent = 'Syncing...';
            break;
        case 'synced':
            iconEl.textContent = '☁️';
            textEl.textContent = 'Synced';
            break;
        case 'error':
            syncEl.classList.add('error');
            iconEl.textContent = '⚠️';
            textEl.textContent = 'Error';
            break;
    }
}

// ============ HELPER FUNCTIONS ============

function getPreview(content) {
    if (!content) return 'No content';
    return content.substring(0, 60) + (content.length > 60 ? '...' : '');
}

function updateCharCount() {
    const content = document.getElementById('noteContent').value;
    document.getElementById('charCount').textContent = `${content.length} characters`;
}

function updateWordCount() {
    const content = document.getElementById('noteContent').value.trim();
    const words = content ? content.split(/\s+/).length : 0;
    document.getElementById('wordCount').textContent = `${words} words`;
}

function updateLastSaved(dateStr) {
    if (!dateStr) return;
    const date = new Date(dateStr);
    document.getElementById('lastSaved').textContent = `Last saved: ${formatTime(date)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ KEYBOARD SHORTCUTS ============

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
    }

    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewNote();
    }

    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchNotes').focus();
    }

    if (e.key === 'Escape') {
        const modal = document.getElementById('deleteTagModal');
        if (modal.style.display === 'flex') {
            closeDeleteTagModal();
            return;
        }

        const dropdown = document.getElementById('tagDropdown');
        if (dropdown.classList.contains('show')) {
            closeTagDropdown();
            return;
        }

        if (currentNoteId) {
            closeNote();
        }
    }
});
