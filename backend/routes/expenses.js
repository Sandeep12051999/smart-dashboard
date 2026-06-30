const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Get all expenses for user (with optional month filter)
    router.get('/', async (req, res) => {
        try {
            const { month } = req.query;

            let query = 'SELECT * FROM expenses WHERE user_id = $1';
            let params = [req.user.id];

            if (month) {
                query += ' AND TO_CHAR(date, \'YYYY-MM\') = $2';
                params.push(month);
            }

            query += ' ORDER BY date DESC, created_at DESC';

            const result = await pool.query(query, params);
            res.json({ expenses: result.rows });
        } catch (error) {
            console.error('Get expenses error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Add expense
    router.post('/', async (req, res) => {
        try {
            const { amount, category, description, date } = req.body;

            if (!amount || !category) {
                return res.status(400).json({ message: 'Amount and category are required' });
            }

            const result = await pool.query(
                'INSERT INTO expenses (user_id, amount, category, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [req.user.id, amount, category, description || '', date || new Date()]
            );

            res.status(201).json({ expense: result.rows[0] });
        } catch (error) {
            console.error('Add expense error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Update expense
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { amount, category, description, date } = req.body;

            const result = await pool.query(
                `UPDATE expenses
                 SET amount = $1, category = $2, description = $3, date = $4
                 WHERE id = $5 AND user_id = $6 RETURNING *`,
                [amount, category, description, date, id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Expense not found' });
            }

            res.json({ expense: result.rows[0] });
        } catch (error) {
            console.error('Update expense error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Delete expense
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Expense not found' });
            }

            res.json({ message: 'Expense deleted' });
        } catch (error) {
            console.error('Delete expense error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    return router;
};
