const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Helper function to update note tags
    async function updateNoteTags(noteId, userId, tagNames) {
        await pool.query('DELETE FROM note_tags WHERE note_id = $1', [noteId]);

        if (!tagNames || tagNames.length === 0) return;

        const tagsResult = await pool.query(
            'SELECT id, name FROM tags WHERE user_id = $1 AND name = ANY($2)',
            [userId, tagNames]
        );

        for (const tag of tagsResult.rows) {
            await pool.query(
                'INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [noteId, tag.id]
            );
        }
    }

    // Get all notes with tags for user
    router.get('/', async (req, res) => {
        try {
            const notesResult = await pool.query(
                'SELECT * FROM notes WHERE user_id = $1 ORDER BY pinned DESC, updated_at DESC',
                [req.user.id]
            );

            const noteIds = notesResult.rows.map(n => n.id);

            let noteTags = [];
            if (noteIds.length > 0) {
                const tagsResult = await pool.query(
                    `SELECT nt.note_id, t.name, t.color
                     FROM note_tags nt
                     JOIN tags t ON nt.tag_id = t.id
                     WHERE nt.note_id = ANY($1)`,
                    [noteIds]
                );
                noteTags = tagsResult.rows;
            }

            const notes = notesResult.rows.map(note => ({
                ...note,
                tags: noteTags
                    .filter(nt => nt.note_id === note.id)
                    .map(nt => nt.name)
            }));

            res.json({ notes });
        } catch (error) {
            console.error('Get notes error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Create note
    router.post('/', async (req, res) => {
        try {
            const { title, content, pinned, tags } = req.body;

            const result = await pool.query(
                'INSERT INTO notes (user_id, title, content, pinned) VALUES ($1, $2, $3, $4) RETURNING *',
                [req.user.id, title || 'Untitled Note', content || '', pinned || false]
            );

            const note = result.rows[0];

            if (tags && tags.length > 0) {
                await updateNoteTags(note.id, req.user.id, tags);
            }

            res.status(201).json({
                note: { ...note, tags: tags || [] }
            });
        } catch (error) {
            console.error('Add note error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Update note
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { title, content, pinned, tags } = req.body;

            const result = await pool.query(
                `UPDATE notes
                 SET title = $1, content = $2, pinned = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4 AND user_id = $5 RETURNING *`,
                [title, content, pinned || false, id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Note not found' });
            }

            if (tags !== undefined) {
                await updateNoteTags(id, req.user.id, tags);
            }

            res.json({
                note: { ...result.rows[0], tags: tags || [] }
            });
        } catch (error) {
            console.error('Update note error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Delete note
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Note not found' });
            }

            res.json({ message: 'Note deleted' });
        } catch (error) {
            console.error('Delete note error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    return router;
};
