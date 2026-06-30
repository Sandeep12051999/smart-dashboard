const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import database config
const { pool, initializeTables } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth')(pool);
const notesRoutes = require('./routes/notes')(pool);
const tagsRoutes = require('./routes/tags')(pool);
const expensesRoutes = require('./routes/expenses')(pool);
const budgetsRoutes = require('./routes/budgets')(pool);
const pomodoroRoutes = require('./routes/pomodoro')(pool);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

// Initialize database tables
initializeTables();

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', authMiddleware, notesRoutes);
app.use('/api/tags', authMiddleware, tagsRoutes);
app.use('/api/expenses', authMiddleware, expensesRoutes);
app.use('/api/budgets', authMiddleware, budgetsRoutes);
app.use('/api/pomodoro', authMiddleware, pomodoroRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});
