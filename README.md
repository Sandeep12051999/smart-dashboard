# 🚀 Smart Dashboard

A modern, full-stack productivity dashboard with multiple apps including Quick Notes, Expense Tracker, Scientific Calculator, and Pomodoro Timer. Built with vanilla JavaScript frontend and Node.js/Express backend with PostgreSQL database.

![Smart Dashboard](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [Step 1: Install Node.js](#step-1-install-nodejs)
  - [Step 2: Install PostgreSQL](#step-2-install-postgresql)
  - [Step 3: Create Database and Tables](#step-3-create-database-and-tables)
  - [Step 4: Setup Project](#step-4-setup-project)
  - [Step 5: Configure Environment](#step-5-configure-environment)
  - [Step 6: Run the Application](#step-6-run-the-application)
- [Optional: Ollama AI Integration](#-optional-ollama-ai-integration)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Remember me functionality

### 📝 Quick Notes
- Create, edit, delete notes
- Pin important notes
- Tag management with colors
- Filter notes by tags
- Search functionality
- Real-time sync with database

### 💰 Expense Tracker
- Track daily expenses
- Monthly budget management
- Category-wise breakdown
- Transaction history
- Visual progress indicators
- Budget for any month/year

### 🔬 Scientific Calculator
- Basic arithmetic operations
- Trigonometric functions (sin, cos, tan, etc.)
- Logarithmic functions (log, ln)
- Powers and roots
- Memory functions (MC, MR, M+, M-)
- DEG/RAD mode toggle
- Calculation history

### 🍅 Pomodoro Timer
- Customizable focus/break durations
- Task management with estimated pomodoros
- Daily and weekly statistics
- Browser notifications
- Sound alerts
- Auto-start options
- Progress visualization

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** (optional) - [Download](https://git-scm.com/)

---

## 🚀 Installation

### Step 1: Install Node.js

1. **Download Node.js:**
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS (Long Term Support)** version
   - Choose the installer for your operating system (Windows/Mac/Linux)

2. **Install Node.js:**
   - Run the downloaded installer
   - Follow the installation wizard (keep default settings)
   - Make sure to check "Add to PATH" option

3. **Verify Installation:**
   Open Command Prompt or Terminal and run:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers like `v18.x.x` and `9.x.x`

---

### Step 2: Install PostgreSQL

#### For Windows:

1. **Download PostgreSQL:**
   - Go to [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Click "Download the installer"
   - Download the latest version (e.g., PostgreSQL 16)

2. **Install PostgreSQL:**
   - Run the downloaded installer
   - Follow the setup wizard:
     - Choose installation directory (default is fine)
     - Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools
     - Choose data directory (default is fine)
     - **Set a password for the `postgres` superuser** (REMEMBER THIS PASSWORD!)
     - Set port number: `5432` (default) or `5433` if 5432 is in use
     - Click "Next" and complete installation

3. **Verify Installation:**
   - Open Command Prompt
   - Navigate to PostgreSQL bin folder:
     ```bash
     cd "C:\Program Files\PostgreSQL\16\bin"
     ```
   - Connect to PostgreSQL:
     ```bash
     psql -U postgres
     ```
   - Enter your password when prompted
   - You should see: `postgres=#`
   - Type `\q` to exit

#### For Mac:

```bash
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16
```

#### For Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

---

### Step 3: Create Database and Tables

1. **Open PostgreSQL Command Line:**

   **Windows:**
   ```bash
   # Open Command Prompt as Administrator
   cd "C:\Program Files\PostgreSQL\16\bin"
   psql -U postgres
   ```

   **Mac/Linux:**
   ```bash
   sudo -u postgres psql
   ```

2. **Create the Database:**
   ```sql
   CREATE DATABASE smart_dashboard;
   ```

3. **Connect to the Database:**
   ```sql
   \c smart_dashboard
   ```

4. **Create All Tables:**

   Copy and paste the following SQL commands:

   ```sql
   -- 1. USERS TABLE
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       name VARCHAR(100) NOT NULL,
       email VARCHAR(255) NOT NULL UNIQUE,
       password VARCHAR(255) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- 2. NOTES TABLE
   CREATE TABLE notes (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       title VARCHAR(255),
       content TEXT,
       pinned BOOLEAN DEFAULT false,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- 3. TAGS TABLE
   CREATE TABLE tags (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       name VARCHAR(50) NOT NULL,
       color VARCHAR(20) DEFAULT '#58a6ff'
   );

   -- 4. NOTE_TAGS TABLE (Junction Table)
   CREATE TABLE note_tags (
       note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
       tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
       PRIMARY KEY (note_id, tag_id)
   );

   -- 5. EXPENSES TABLE
   CREATE TABLE expenses (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       amount NUMERIC(12, 2) NOT NULL,
       category VARCHAR(50) NOT NULL,
       description TEXT,
       date DATE NOT NULL DEFAULT CURRENT_DATE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- 6. BUDGETS TABLE
   CREATE TABLE budgets (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       total_budget NUMERIC(12, 2),
       month VARCHAR(20)
   );

   -- 7. CATEGORY_BUDGETS TABLE
   CREATE TABLE category_budgets (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       category VARCHAR(50) NOT NULL,
       budget_limit NUMERIC(12, 2)
   );

   -- 8. POMODORO_TASKS TABLE
   CREATE TABLE pomodoro_tasks (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       title VARCHAR(255) NOT NULL,
       estimated_pomodoros INTEGER DEFAULT 1,
       pomodoros_spent INTEGER DEFAULT 0,
       completed BOOLEAN DEFAULT false,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- 9. POMODORO_STATS TABLE
   CREATE TABLE pomodoro_stats (
       id SERIAL PRIMARY KEY,
       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
       date DATE NOT NULL DEFAULT CURRENT_DATE,
       pomodoros_completed INTEGER DEFAULT 0,
       focus_time INTEGER DEFAULT 0,
       tasks_completed INTEGER DEFAULT 0,
       UNIQUE(user_id, date)
   );

   -- 10. POMODORO_SETTINGS TABLE
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

   -- INDEXES FOR BETTER PERFORMANCE
   CREATE INDEX idx_notes_user ON notes(user_id);
   CREATE INDEX idx_tags_user ON tags(user_id);
   CREATE INDEX idx_expenses_user ON expenses(user_id);
   CREATE INDEX idx_expenses_date ON expenses(date);
   CREATE INDEX idx_expenses_category ON expenses(category);
   CREATE INDEX idx_budgets_user ON budgets(user_id);
   CREATE INDEX idx_pomodoro_tasks_user ON pomodoro_tasks(user_id);
   CREATE INDEX idx_pomodoro_stats_user ON pomodoro_stats(user_id);
   CREATE INDEX idx_pomodoro_stats_date ON pomodoro_stats(date);
   ```

5. **Verify Tables Created:**
   ```sql
   \dt
   ```
   You should see all 10 tables listed.

6. **Exit PostgreSQL:**
   ```sql
   \q
   ```

---

### Step 4: Setup Project

1. **Navigate to Project Directory:**
   ```bash
   cd smart-dashboard
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

   This will install:
   - express
   - cors
   - pg (PostgreSQL client)
   - bcryptjs
   - jsonwebtoken
   - dotenv

---

### Step 5: Configure Environment

1. **Create Environment File:**

   Create a file named `.env` in the `backend` folder:

   ```bash
   cd backend
   ```

   Create `.env` file with the following content:

   ```env
   # Server Configuration
   PORT=5500

   # Database Configuration
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=smart_dashboard
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432

   # JWT Secret (change this to a random string)
   JWT_SECRET=your-super-secret-key-change-in-production
   ```

   **⚠️ Important:** Replace `your_postgres_password` with the password you set during PostgreSQL installation.

---

### Step 6: Run the Application

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm start
   ```

   You should see:
   ```
   ✅ Connected to PostgreSQL database: smart_dashboard
   ✅ Database tables initialized
   Server running on port 5500
   API available at http://localhost:5500/api
   ```

2. **Open the Frontend:**

   Option A: Using Live Server (VS Code Extension)
   - Install "Live Server" extension in VS Code
   - Right-click on `index.html` and select "Open with Live Server"

   Option B: Direct File Opening
   - Open `index.html` in your browser
   - Or navigate to `login.html` to start

3. **Access the Application:**
   - Open your browser
   - Go to: `http://localhost:5500` (if using Live Server) or open `login.html`
   - Create a new account or login

---

## 🤖 Optional: Ollama AI Integration

If you want to add AI features to your dashboard using local LLMs:

### Step 1: Install Ollama

1. **Download Ollama:**
   - Go to [https://ollama.ai/](https://ollama.ai/)
   - Click "Download"
   - Choose your operating system (Windows/Mac/Linux)

2. **Install Ollama:**
   - **Windows:** Run the downloaded `.exe` installer
   - **Mac:** Run the downloaded `.dmg` file
   - **Linux:**
     ```bash
     curl -fsSL https://ollama.ai/install.sh | sh
     ```

3. **Verify Installation:**
   ```bash
   ollama --version
   ```

### Step 2: Pull LLaMA 3.2 Model

1. **Open Terminal/Command Prompt**

2. **Pull the Model:**
   ```bash
   ollama pull llama3.2
   ```

   This will download the LLaMA 3.2 model (~2GB). Wait for the download to complete.

3. **Verify Model Installed:**
   ```bash
   ollama list
   ```

   You should see `llama3.2` in the list.

### Step 3: Run Ollama

1. **Start Ollama Server:**
   ```bash
   ollama serve
   ```

   The server will run on `http://localhost:11434`

2. **Test the Model:**
   ```bash
   ollama run llama3.2
   ```

   Type a message and press Enter to test.

### Using Ollama API

You can integrate Ollama with your dashboard using the API:

```javascript
// Example: Send a prompt to Ollama
async function askAI(prompt) {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'llama3.2',
            prompt: prompt,
            stream: false
        })
    });
    const data = await response.json();
    return data.response;
}
```

---

## 📁 Project Structure

```
smart-dashboard/
├── backend/
│   ├── config/
│   │   └── db.js              # Database configuration
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── notes.js           # Notes CRUD routes
│   │   ├── tags.js            # Tags CRUD routes
│   │   ├── expenses.js        # Expenses routes
│   │   ├── budgets.js         # Budgets routes
│   │   └── pomodoro.js        # Pomodoro routes
│   ├── server.js              # Main server file
│   ├── schemas.sql            # Database schema
│   ├── package.json           # Dependencies
│   └── .env                   # Environment variables
├── notes/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── expense-tracker/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── calculator/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── pomodoro/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── index.html                 # Main dashboard
├── login.html                 # Login page
├── signup.html                # Signup page
├── auth.css                   # Auth styles
└── README.md                  # This file
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes |
| POST | `/api/notes` | Create note |
| PUT | `/api/notes/:id` | Update note |
| DELETE | `/api/notes/:id` | Delete note |

### Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | Get all tags |
| POST | `/api/tags` | Create tag |
| DELETE | `/api/tags/:id` | Delete tag |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Add expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | Get all budgets |
| GET | `/api/budgets/:month` | Get budget for month |
| POST | `/api/budgets` | Create/update budget |
| DELETE | `/api/budgets/:month` | Delete budget |

### Pomodoro
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pomodoro/settings` | Get settings |
| PUT | `/api/pomodoro/settings` | Update settings |
| GET | `/api/pomodoro/stats/today` | Get today's stats |
| GET | `/api/pomodoro/stats` | Get stats (date range) |
| POST | `/api/pomodoro/stats/pomodoro` | Record pomodoro |
| GET | `/api/pomodoro/tasks` | Get all tasks |
| POST | `/api/pomodoro/tasks` | Create task |
| PUT | `/api/pomodoro/tasks/:id` | Update task |
| DELETE | `/api/pomodoro/tasks/:id` | Delete task |

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot connect to PostgreSQL"
- Make sure PostgreSQL service is running
- Check if the port (5432 or 5433) is correct in `.env`
- Verify username and password

**Windows:**
```bash
# Check if PostgreSQL is running
services.msc
# Look for "postgresql-x64-16" and ensure it's running
```

#### 2. "ECONNREFUSED" error
- Backend server is not running
- Run `npm start` in the backend folder

#### 3. "Invalid token" error
- Clear localStorage in browser
- Login again

#### 4. Database tables not found
- Make sure you ran all CREATE TABLE commands
- Connect to the correct database: `\c smart_dashboard`

#### 5. Port already in use
- Change the PORT in `.env` file
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :5500
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -i :5500
  kill -9 <PID>
  ```

### Check Database Tables

```sql
-- Connect to database
psql -U postgres -d smart_dashboard

-- List all tables
\dt

-- Check table structure
\d users
\d notes
\d expenses
```

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 👨‍💻 Author

**Sandeep Patidar**

---

## ⭐ Show your support

Give a ⭐ if this project helped you!
