const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // ============ SETTINGS ============

    // Get user settings (create default if not exists)
    router.get('/settings', async (req, res) => {
        try {
            let result = await pool.query(
                'SELECT * FROM pomodoro_settings WHERE user_id = $1',
                [req.user.id]
            );

            if (result.rows.length === 0) {
                // Create default settings
                result = await pool.query(
                    `INSERT INTO pomodoro_settings
                     (user_id, work_duration, short_break, long_break, long_break_after, auto_start_breaks, auto_start_pomodoros, sound_enabled, browser_notifications)
                     VALUES ($1, 25, 5, 15, 4, false, false, true, true)
                     RETURNING *`,
                    [req.user.id]
                );
            }

            res.json({ settings: result.rows[0] });
        } catch (error) {
            console.error('Get pomodoro settings error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Update settings
    router.put('/settings', async (req, res) => {
        try {
            const {
                work_duration,
                short_break,
                long_break,
                long_break_after,
                auto_start_breaks,
                auto_start_pomodoros,
                sound_enabled,
                browser_notifications
            } = req.body;

            // Check if settings exist
            const existing = await pool.query(
                'SELECT * FROM pomodoro_settings WHERE user_id = $1',
                [req.user.id]
            );

            let result;
            if (existing.rows.length === 0) {
                result = await pool.query(
                    `INSERT INTO pomodoro_settings
                     (user_id, work_duration, short_break, long_break, long_break_after, auto_start_breaks, auto_start_pomodoros, sound_enabled, browser_notifications)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING *`,
                    [req.user.id, work_duration || 25, short_break || 5, long_break || 15, long_break_after || 4, auto_start_breaks || false, auto_start_pomodoros || false, sound_enabled !== false, browser_notifications !== false]
                );
            } else {
                result = await pool.query(
                    `UPDATE pomodoro_settings
                     SET work_duration = $1, short_break = $2, long_break = $3, long_break_after = $4,
                         auto_start_breaks = $5, auto_start_pomodoros = $6, sound_enabled = $7, browser_notifications = $8
                     WHERE user_id = $9
                     RETURNING *`,
                    [work_duration || 25, short_break || 5, long_break || 15, long_break_after || 4, auto_start_breaks || false, auto_start_pomodoros || false, sound_enabled !== false, browser_notifications !== false, req.user.id]
                );
            }

            res.json({ settings: result.rows[0] });
        } catch (error) {
            console.error('Update pomodoro settings error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // ============ STATS ============

    // Get stats for today
    router.get('/stats/today', async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            let result = await pool.query(
                'SELECT * FROM pomodoro_stats WHERE user_id = $1 AND date = $2',
                [req.user.id, today]
            );

            if (result.rows.length === 0) {
                res.json({
                    stats: {
                        date: today,
                        pomodoros_completed: 0,
                        focus_time: 0,
                        tasks_completed: 0
                    }
                });
            } else {
                res.json({ stats: result.rows[0] });
            }
        } catch (error) {
            console.error('Get today stats error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Get stats for date range (weekly/monthly)
    router.get('/stats', async (req, res) => {
        try {
            const { from, to } = req.query;

            let query = 'SELECT * FROM pomodoro_stats WHERE user_id = $1';
            let params = [req.user.id];

            if (from && to) {
                query += ' AND date >= $2 AND date <= $3';
                params.push(from, to);
            } else if (from) {
                query += ' AND date >= $2';
                params.push(from);
            }

            query += ' ORDER BY date DESC';

            const result = await pool.query(query, params);

            // Calculate totals
            const totals = result.rows.reduce((acc, row) => ({
                pomodoros_completed: acc.pomodoros_completed + row.pomodoros_completed,
                focus_time: acc.focus_time + row.focus_time,
                tasks_completed: acc.tasks_completed + row.tasks_completed
            }), { pomodoros_completed: 0, focus_time: 0, tasks_completed: 0 });

            res.json({
                stats: result.rows,
                totals
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Record completed pomodoro
    router.post('/stats/pomodoro', async (req, res) => {
        try {
            const { focus_time } = req.body;
            const today = new Date().toISOString().split('T')[0];

            // Check if today's stats exist
            const existing = await pool.query(
                'SELECT * FROM pomodoro_stats WHERE user_id = $1 AND date = $2',
                [req.user.id, today]
            );

            let result;
            if (existing.rows.length === 0) {
                result = await pool.query(
                    `INSERT INTO pomodoro_stats (user_id, date, pomodoros_completed, focus_time, tasks_completed)
                     VALUES ($1, $2, 1, $3, 0)
                     RETURNING *`,
                    [req.user.id, today, focus_time || 25]
                );
            } else {
                result = await pool.query(
                    `UPDATE pomodoro_stats
                     SET pomodoros_completed = pomodoros_completed + 1, focus_time = focus_time + $1
                     WHERE user_id = $2 AND date = $3
                     RETURNING *`,
                    [focus_time || 25, req.user.id, today]
                );
            }

            res.json({ stats: result.rows[0] });
        } catch (error) {
            console.error('Record pomodoro error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // ============ TASKS ============

    // Get all tasks
    router.get('/tasks', async (req, res) => {
        try {
            const { completed } = req.query;

            let query = 'SELECT * FROM pomodoro_tasks WHERE user_id = $1';
            let params = [req.user.id];

            if (completed !== undefined) {
                query += ' AND completed = $2';
                params.push(completed === 'true');
            }

            query += ' ORDER BY created_at DESC';

            const result = await pool.query(query, params);
            res.json({ tasks: result.rows });
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Create task
    router.post('/tasks', async (req, res) => {
        try {
            const { title, estimated_pomodoros } = req.body;

            if (!title) {
                return res.status(400).json({ message: 'Title is required' });
            }

            const result = await pool.query(
                `INSERT INTO pomodoro_tasks (user_id, title, estimated_pomodoros)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [req.user.id, title, estimated_pomodoros || 1]
            );

            res.status(201).json({ task: result.rows[0] });
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Update task
    router.put('/tasks/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { title, estimated_pomodoros, pomodoros_spent, completed } = req.body;

            const result = await pool.query(
                `UPDATE pomodoro_tasks
                 SET title = COALESCE($1, title),
                     estimated_pomodoros = COALESCE($2, estimated_pomodoros),
                     pomodoros_spent = COALESCE($3, pomodoros_spent),
                     completed = COALESCE($4, completed)
                 WHERE id = $5 AND user_id = $6
                 RETURNING *`,
                [title, estimated_pomodoros, pomodoros_spent, completed, id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Task not found' });
            }

            // Update daily stats if task is completed
            if (completed === true) {
                const today = new Date().toISOString().split('T')[0];
                await pool.query(
                    `INSERT INTO pomodoro_stats (user_id, date, pomodoros_completed, focus_time, tasks_completed)
                     VALUES ($1, $2, 0, 0, 1)
                     ON CONFLICT (user_id, date) DO UPDATE SET tasks_completed = pomodoro_stats.tasks_completed + 1`,
                    [req.user.id, today]
                );
            }

            res.json({ task: result.rows[0] });
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Increment pomodoros spent on task
    router.post('/tasks/:id/pomodoro', async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                `UPDATE pomodoro_tasks
                 SET pomodoros_spent = pomodoros_spent + 1
                 WHERE id = $1 AND user_id = $2
                 RETURNING *`,
                [id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Task not found' });
            }

            res.json({ task: result.rows[0] });
        } catch (error) {
            console.error('Increment pomodoro error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    // Delete task
    router.delete('/tasks/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const result = await pool.query(
                'DELETE FROM pomodoro_tasks WHERE id = $1 AND user_id = $2 RETURNING *',
                [id, req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Task not found' });
            }

            res.json({ message: 'Task deleted' });
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });

    return router;
};
