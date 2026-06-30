const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // Get all budgets for user
    router.get('/', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT * FROM budgets WHERE user_id = $1 ORDER BY month DESC',
                [req.user.id]
            );
            res.json({ budgets: result.rows });
        } catch (error) {
            console.error('Get budgets error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Get budget for specific month
    router.get('/:month', async (req, res) => {
        try {
            const { month } = req.params;

            const result = await pool.query(
                'SELECT * FROM budgets WHERE user_id = $1 AND month = $2',
                [req.user.id, month]
            );

            if (result.rows.length === 0) {
                return res.json({ budget: null });
            }

            res.json({ budget: result.rows[0] });
        } catch (error) {
            console.error('Get budget error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Create or update budget for a month
    router.post('/', async (req, res) => {
        try {
            const { month, total_budget } = req.body;

            if (!month || total_budget === undefined) {
                return res.status(400).json({ message: 'Month and budget amount are required' });
            }

            const existing = await pool.query(
                'SELECT * FROM budgets WHERE user_id = $1 AND month = $2',
                [req.user.id, month]
            );

            let result;
            if (existing.rows.length > 0) {
                result = await pool.query(
                    'UPDATE budgets SET total_budget = $1 WHERE user_id = $2 AND month = $3 RETURNING *',
                    [total_budget, req.user.id, month]
                );
            } else {
                result = await pool.query(
                    'INSERT INTO budgets (user_id, month, total_budget) VALUES ($1, $2, $3) RETURNING *',
                    [req.user.id, month, total_budget]
                );
            }

            res.status(201).json({ budget: result.rows[0] });
        } catch (error) {
            console.error('Save budget error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Delete budget
    router.delete('/:month', async (req, res) => {
        try {
            const { month } = req.params;

            const result = await pool.query(
                'DELETE FROM budgets WHERE user_id = $1 AND month = $2 RETURNING *',
                [req.user.id, month]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Budget not found' });
            }

            res.json({ message: 'Budget deleted' });
        } catch (error) {
            console.error('Delete budget error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    return router;
};
