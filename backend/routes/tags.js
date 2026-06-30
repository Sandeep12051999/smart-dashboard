const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Get all tags for user
    router.get('/', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT * FROM tags WHERE user_id = $1 ORDER BY name',
                [req.user.id]
            );
            res.json({ tags: result.rows });
        } catch (error) {
            console.error('Get tags error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Create tag
    router.post('/', async (req, res) => {
        try {
            const { name, color } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Tag name is required' });
            }

            const existing = await pool.query(
                'SELECT * FROM tags WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
                [req.user.id, name]
            );

            if (existing.rows.length > 0) {
                return res.status(400).json({ message: 'Tag already exists' });
            }

            const result = await pool.query(
                'INSERT INTO tags (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
                [req.user.id, name, color || '#8b949e']
            );

            res.status(201).json({ tag: result.rows[0] });
        } catch (error) {
            console.error('Add tag error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Delete tag
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                'DELETE FROM tags WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Tag not found' });
            }

            res.json({ message: 'Tag deleted' });
        } catch (error) {
            console.error('Delete tag error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    return router;
};
