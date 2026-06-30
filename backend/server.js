const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import database config
const { pool, initializeTables } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Initialize database tables
initializeTables();

// In-memory storage fallback
const inMemoryUsers = [];

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// ============ AUTH ROUTES ============

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            // Try database first
            const existingUser = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            if (existingUser.rows.length > 0) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            const result = await pool.query(
                'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
                [name, email, hashedPassword]
            );

            res.status(201).json({
                message: 'User registered successfully',
                user: result.rows[0]
            });
        } catch (dbError) {
            // Fallback to in-memory
            const existingUser = inMemoryUsers.find(u => u.email === email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            const newUser = {
                id: inMemoryUsers.length + 1,
                name,
                email,
                password: hashedPassword
            };
            inMemoryUsers.push(newUser);

            res.status(201).json({
                message: 'User registered successfully',
                user: { id: newUser.id, name, email }
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        let user;

        try {
            // Try database first
            const result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            user = result.rows[0];
        } catch (dbError) {
            // Fallback to in-memory
            user = inMemoryUsers.find(u => u.email === email);
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        let user;

        try {
            const result = await pool.query(
                'SELECT id, name, email, created_at FROM users WHERE id = $1',
                [req.user.id]
            );
            user = result.rows[0];
        } catch (dbError) {
            user = inMemoryUsers.find(u => u.id === req.user.id);
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ EXPENSE ROUTES ============

// Get all expenses for user
app.get('/api/expenses', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
            [req.user.id]
        );
        res.json({ expenses: result.rows });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add expense
app.post('/api/expenses', authMiddleware, async (req, res) => {
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

// Delete expense
app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
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

// ============ NOTES ROUTES ============

// Get all notes for user
app.get('/api/notes', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.user.id]
        );
        res.json({ notes: result.rows });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add note
app.post('/api/notes', authMiddleware, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const result = await pool.query(
            'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, title, content || '']
        );

        res.status(201).json({ note: result.rows[0] });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update note
app.put('/api/notes/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const result = await pool.query(
            'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
            [title, content, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.json({ note: result.rows[0] });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete note
app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
});
