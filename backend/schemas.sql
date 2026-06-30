-- ============================================
-- SMART DASHBOARD DATABASE SCHEMA
-- Database: smart_dashboard (PostgreSQL)
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. NOTES TABLE
-- ============================================
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT,
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. TAGS TABLE
-- ============================================
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#58a6ff'
);

-- ============================================
-- 4. NOTE_TAGS TABLE (Junction Table)
-- ============================================
CREATE TABLE note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

-- ============================================
-- 5. EXPENSES TABLE
-- ============================================
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. BUDGETS TABLE
-- ============================================
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_budget NUMERIC(12, 2),
    month VARCHAR(20)
);

-- ============================================
-- 7. CATEGORY_BUDGETS TABLE
-- ============================================
CREATE TABLE category_budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    budget_limit NUMERIC(12, 2)
);

-- ============================================
-- 8. POMODORO_TASKS TABLE
-- ============================================
CREATE TABLE pomodoro_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    estimated_pomodoros INTEGER DEFAULT 1,
    pomodoros_spent INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. POMODORO_STATS TABLE
-- ============================================
CREATE TABLE pomodoro_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    pomodoros_completed INTEGER DEFAULT 0,
    focus_time INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0
);

-- ============================================
-- 10. POMODORO_SETTINGS TABLE
-- ============================================
CREATE TABLE pomodoro_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    work_duration INTEGER DEFAULT 25,
    short_break INTEGER DEFAULT 5,
    long_break INTEGER DEFAULT 15,
    long_break_after INTEGER DEFAULT 4,
    auto_start_breaks BOOLEAN DEFAULT false,
    auto_start_pomodoros BOOLEAN DEFAULT false,
    sound_enabled BOOLEAN DEFAULT true,
    browser_notifications BOOLEAN DEFAULT true
);

-- ============================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_category_budgets_user ON category_budgets(user_id);
CREATE INDEX idx_pomodoro_tasks_user ON pomodoro_tasks(user_id);
CREATE INDEX idx_pomodoro_stats_user ON pomodoro_stats(user_id);
CREATE INDEX idx_pomodoro_stats_date ON pomodoro_stats(date);
