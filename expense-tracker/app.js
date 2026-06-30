// Expense Tracker App - Database Connected

const API_BASE = 'http://localhost:5500/api';

// State
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let expenses = [];
let budgets = {};
let syncStatus = 'synced';

// Category configuration
const categories = {
    food: { icon: '🍔', name: 'Food & Dining' },
    transport: { icon: '🚗', name: 'Transport' },
    shopping: { icon: '🛒', name: 'Shopping' },
    bills: { icon: '📱', name: 'Bills & Utilities' },
    entertainment: { icon: '🎬', name: 'Entertainment' },
    health: { icon: '💊', name: 'Health' },
    education: { icon: '📚', name: 'Education' },
    other: { icon: '📦', name: 'Other' }
};

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// Check authentication
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '../login.html';
        return false;
    }
    return true;
}

// API helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '../login.html';
        throw new Error('Unauthorized');
    }

    return response;
}

// Update sync status indicator
function updateSyncStatus(status) {
    syncStatus = status;
    const syncEl = document.getElementById('syncStatus');
    if (!syncEl) return;

    const icons = { syncing: '🔄', synced: '☁️', error: '⚠️' };
    const texts = { syncing: 'Syncing...', synced: 'Synced', error: 'Sync Error' };

    syncEl.className = `sync-status ${status}`;
    syncEl.innerHTML = `
        <span class="sync-icon">${icons[status]}</span>
        <span class="sync-text">${texts[status]}</span>
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    setDefaultDate();
    await loadData();
    updateUI();
    renderCategoryBreakdown();
    renderHistory();
});

// Get month key for storage (YYYY-MM format)
function getMonthKey(year = currentYear, month = currentMonth) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// Load data from database
async function loadData() {
    updateSyncStatus('syncing');

    try {
        // Load all expenses
        const expensesRes = await apiRequest('/expenses');
        if (expensesRes.ok) {
            const data = await expensesRes.json();
            expenses = data.expenses || [];
        }

        // Load all budgets
        const budgetsRes = await apiRequest('/budgets');
        if (budgetsRes.ok) {
            const data = await budgetsRes.json();
            // Convert array to object keyed by month
            budgets = {};
            (data.budgets || []).forEach(b => {
                budgets[b.month] = parseFloat(b.total_budget);
            });
        }

        updateSyncStatus('synced');
    } catch (error) {
        console.error('Load data error:', error);
        updateSyncStatus('error');
    }
}

// Set default date to today
function setDefaultDate() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// Change month navigation
function changeMonth(direction) {
    currentMonth += direction;

    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    updateUI();
    renderHistory();
}

// Go to current month
function goToCurrentMonth() {
    currentMonth = new Date().getMonth();
    currentYear = new Date().getFullYear();
    updateUI();
    renderHistory();
}

// Get expenses for current month
function getMonthExpenses() {
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth &&
               expenseDate.getFullYear() === currentYear;
    });
}

// Get budget for current month
function getMonthBudget() {
    const key = getMonthKey();
    return budgets[key] || 0;
}

// Calculate total spent for current month
function calculateTotalSpent() {
    const monthExpenses = getMonthExpenses();
    return monthExpenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
}

// Update all UI elements
function updateUI() {
    updateMonthDisplay();
    updateSummaryCards();
    renderExpenseList();
    renderCategoryBreakdown();
}

// Update month display
function updateMonthDisplay() {
    const monthNameEl = document.getElementById('monthName');
    const budgetMonthLabel = document.getElementById('budgetMonthLabel');
    const displayText = `${monthNames[currentMonth]} ${currentYear}`;

    monthNameEl.textContent = displayText;
    if (budgetMonthLabel) {
        budgetMonthLabel.textContent = displayText;
    }
}

// Update summary cards
function updateSummaryCards() {
    const budget = getMonthBudget();
    const spent = calculateTotalSpent();
    const remaining = budget - spent;
    const monthExpenses = getMonthExpenses();

    document.getElementById('monthlyBudget').textContent = formatCurrency(budget);
    document.getElementById('totalSpent').textContent = formatCurrency(spent);
    document.getElementById('remaining').textContent = formatCurrency(remaining);
    document.getElementById('transactionCount').textContent = monthExpenses.length;

    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    if (budget > 0) {
        const percentage = Math.min((spent / budget) * 100, 100);
        progressFill.style.width = `${percentage}%`;

        progressFill.classList.remove('warning', 'danger');
        if (percentage > 90) {
            progressFill.classList.add('danger');
        } else if (percentage > 70) {
            progressFill.classList.add('warning');
        }
    } else {
        progressFill.style.width = '0%';
    }

    // Update remaining card color
    const remainingEl = document.getElementById('remaining');
    if (remaining < 0) {
        remainingEl.style.color = '#f85149';
    } else {
        remainingEl.style.color = '#3fb950';
    }
}

// Format currency
function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

// Add new expense
async function addExpense(event) {
    event.preventDefault();

    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    if (!amount || !category) {
        alert('Please fill in amount and category');
        return;
    }

    updateSyncStatus('syncing');

    try {
        const response = await apiRequest('/expenses', {
            method: 'POST',
            body: JSON.stringify({
                amount: parseFloat(amount),
                category,
                description: description || categories[category].name,
                date: date || new Date().toISOString().split('T')[0]
            })
        });

        if (response.ok) {
            const data = await response.json();
            expenses.push(data.expense);

            // Update view to show the month where expense was added
            const expenseDate = new Date(data.expense.date);
            if (expenseDate.getMonth() !== currentMonth || expenseDate.getFullYear() !== currentYear) {
                currentMonth = expenseDate.getMonth();
                currentYear = expenseDate.getFullYear();
            }

            updateUI();
            renderHistory();
            updateSyncStatus('synced');

            // Reset form
            document.getElementById('expenseForm').reset();
            setDefaultDate();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to add expense');
            updateSyncStatus('error');
        }
    } catch (error) {
        console.error('Add expense error:', error);
        alert('Failed to add expense. Please try again.');
        updateSyncStatus('error');
    }
}

// Delete expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    updateSyncStatus('syncing');

    try {
        const response = await apiRequest(`/expenses/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            expenses = expenses.filter(expense => expense.id !== id);
            updateUI();
            renderHistory();
            updateSyncStatus('synced');
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to delete expense');
            updateSyncStatus('error');
        }
    } catch (error) {
        console.error('Delete expense error:', error);
        alert('Failed to delete expense. Please try again.');
        updateSyncStatus('error');
    }
}

// Render expense list
function renderExpenseList() {
    const expenseList = document.getElementById('expenseList');
    const filterCategory = document.getElementById('filterCategory').value;

    let monthExpenses = getMonthExpenses();

    // Apply category filter
    if (filterCategory !== 'all') {
        monthExpenses = monthExpenses.filter(expense => expense.category === filterCategory);
    }

    // Sort by date (newest first)
    monthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (monthExpenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <p>No expenses for ${monthNames[currentMonth]} ${currentYear}. Start tracking!</p>
            </div>
        `;
        return;
    }

    expenseList.innerHTML = monthExpenses.map(expense => {
        const cat = categories[expense.category] || categories.other;
        const date = new Date(expense.date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });

        return `
            <div class="expense-item">
                <div class="expense-icon">${cat.icon}</div>
                <div class="expense-details">
                    <h4>${expense.description}</h4>
                    <p>${cat.name} • ${date}</p>
                </div>
                <span class="expense-amount">-${formatCurrency(parseFloat(expense.amount))}</span>
                <button class="btn-delete" onclick="deleteExpense(${expense.id})">🗑️</button>
            </div>
        `;
    }).join('');
}

// Filter expenses by category
function filterExpenses() {
    renderExpenseList();
}

// Render category breakdown
function renderCategoryBreakdown() {
    const categoryList = document.getElementById('categoryList');
    const monthExpenses = getMonthExpenses();

    // Calculate totals per category
    const categoryTotals = {};
    Object.keys(categories).forEach(cat => {
        categoryTotals[cat] = 0;
    });

    monthExpenses.forEach(expense => {
        if (categoryTotals.hasOwnProperty(expense.category)) {
            categoryTotals[expense.category] += parseFloat(expense.amount);
        } else {
            categoryTotals.other += parseFloat(expense.amount);
        }
    });

    categoryList.innerHTML = Object.entries(categories).map(([key, cat]) => {
        const total = categoryTotals[key];
        return `
            <div class="category-item" onclick="filterByCategory('${key}')">
                <span class="icon">${cat.icon}</span>
                <span class="name">${cat.name}</span>
                <span class="amount">${formatCurrency(total)}</span>
            </div>
        `;
    }).join('');
}

// Filter by clicking category
function filterByCategory(category) {
    document.getElementById('filterCategory').value = category;
    filterExpenses();
}

// Render monthly history
function renderHistory() {
    const historyList = document.getElementById('historyList');
    const currentKey = getMonthKey();

    // Get all months that have data (expenses or budgets)
    const monthsWithData = new Set();

    expenses.forEach(expense => {
        const date = new Date(expense.date);
        monthsWithData.add(getMonthKey(date.getFullYear(), date.getMonth()));
    });

    Object.keys(budgets).forEach(key => {
        monthsWithData.add(key);
    });

    // Add current month
    monthsWithData.add(currentKey);

    // Add last 6 months
    for (let i = 0; i < 6; i++) {
        let month = new Date().getMonth() - i;
        let year = new Date().getFullYear();

        if (month < 0) {
            month += 12;
            year--;
        }

        monthsWithData.add(getMonthKey(year, month));
    }

    // Sort months in descending order
    const sortedMonths = Array.from(monthsWithData).sort().reverse().slice(0, 6);

    historyList.innerHTML = sortedMonths.map(key => {
        const [year, month] = key.split('-').map(Number);
        const monthIndex = month - 1;

        // Calculate expenses for this month
        const monthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === monthIndex &&
                   expenseDate.getFullYear() === year;
        });

        const spent = monthExpenses.reduce((total, e) => total + parseFloat(e.amount), 0);
        const budget = budgets[key] || 0;
        const isOver = budget > 0 && spent > budget;
        const isCurrent = key === currentKey;

        return `
            <div class="history-item ${isCurrent ? 'current' : ''}" onclick="navigateToMonth(${year}, ${monthIndex})">
                <div class="month">${monthNames[monthIndex]} ${year}</div>
                <div class="stats">
                    <span class="spent">Spent: ${formatCurrency(spent)}</span>
                    <span class="budget">Budget: ${formatCurrency(budget)}</span>
                </div>
                ${budget > 0 ? `
                    <span class="status ${isOver ? 'over' : 'under'}">
                        ${isOver ? 'Over budget' : 'Under budget'}
                    </span>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Navigate to specific month from history
function navigateToMonth(year, month) {
    currentYear = year;
    currentMonth = month;
    updateUI();
    renderHistory();
}

// Budget Modal Functions
function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const budgetInput = document.getElementById('budgetAmount');
    const monthSelect = document.getElementById('budgetMonth');
    const yearSelect = document.getElementById('budgetYear');

    // Populate year dropdown (2020 to 2035)
    yearSelect.innerHTML = '';
    for (let y = 2020; y <= 2035; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }

    // Set current month
    monthSelect.value = currentMonth;

    // Update preview and input
    updateBudgetPreview();

    modal.classList.add('show');
}

function updateBudgetPreview() {
    const monthSelect = document.getElementById('budgetMonth');
    const yearSelect = document.getElementById('budgetYear');
    const budgetInput = document.getElementById('budgetAmount');
    const previewAmount = document.getElementById('previewAmount');

    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearSelect.value);
    const key = getMonthKey(selectedYear, selectedMonth);

    const existingBudget = budgets[key] || 0;
    previewAmount.textContent = formatCurrency(existingBudget);
    budgetInput.value = existingBudget > 0 ? existingBudget : '';
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    modal.classList.remove('show');
}

function setBudgetValue(value) {
    document.getElementById('budgetAmount').value = value;
}

async function saveBudget() {
    const budgetInput = document.getElementById('budgetAmount');
    const monthSelect = document.getElementById('budgetMonth');
    const yearSelect = document.getElementById('budgetYear');

    const amount = parseFloat(budgetInput.value) || 0;
    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearSelect.value);
    const key = getMonthKey(selectedYear, selectedMonth);

    updateSyncStatus('syncing');

    try {
        if (amount > 0) {
            const response = await apiRequest('/budgets', {
                method: 'POST',
                body: JSON.stringify({
                    month: key,
                    total_budget: amount
                })
            });

            if (response.ok) {
                budgets[key] = amount;
                updateSyncStatus('synced');
            } else {
                const error = await response.json();
                alert(error.message || 'Failed to save budget');
                updateSyncStatus('error');
                return;
            }
        } else {
            // Delete budget if amount is 0
            const response = await apiRequest(`/budgets/${key}`, {
                method: 'DELETE'
            });

            if (response.ok || response.status === 404) {
                delete budgets[key];
                updateSyncStatus('synced');
            } else {
                updateSyncStatus('error');
            }
        }

        updateUI();
        renderHistory();
        closeBudgetModal();
    } catch (error) {
        console.error('Save budget error:', error);
        alert('Failed to save budget. Please try again.');
        updateSyncStatus('error');
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('budgetModal');
    if (event.target === modal) {
        closeBudgetModal();
    }
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBudgetModal();
    }

    // Arrow keys for month navigation when not in input
    if (document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'SELECT') {
        if (e.key === 'ArrowLeft') {
            changeMonth(-1);
        } else if (e.key === 'ArrowRight') {
            changeMonth(1);
        }
    }
});
