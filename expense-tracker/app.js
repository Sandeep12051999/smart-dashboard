// Expense Tracker App with Monthly Data Management

// State
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let expenses = [];
let budgets = {};

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setDefaultDate();
    updateUI();
    renderCategoryBreakdown();
    renderHistory();
});

// Get month key for storage (YYYY-MM format)
function getMonthKey(year = currentYear, month = currentMonth) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// Load data from localStorage
function loadData() {
    const savedExpenses = localStorage.getItem('expenses');
    const savedBudgets = localStorage.getItem('budgets');

    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }

    if (savedBudgets) {
        budgets = JSON.parse(savedBudgets);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('budgets', JSON.stringify(budgets));
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

    document.getElementById('monthlyBudget').textContent = formatCurrency(budget);
    document.getElementById('totalSpent').textContent = formatCurrency(spent);
    document.getElementById('remaining').textContent = formatCurrency(remaining);

    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    if (budget > 0) {
        const percentage = Math.min((spent / budget) * 100, 100);
        progressFill.style.width = `${percentage}%`;

        // Change color based on percentage
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
function addExpense(event) {
    event.preventDefault();

    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    if (!amount || !category) {
        alert('Please fill in amount and category');
        return;
    }

    const expense = {
        id: Date.now(),
        amount: parseFloat(amount),
        category,
        description: description || categories[category].name,
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    expenses.push(expense);
    saveData();

    // Update view to show the month where expense was added
    const expenseDate = new Date(expense.date);
    if (expenseDate.getMonth() !== currentMonth || expenseDate.getFullYear() !== currentYear) {
        currentMonth = expenseDate.getMonth();
        currentYear = expenseDate.getFullYear();
    }

    updateUI();
    renderHistory();

    // Reset form
    document.getElementById('expenseForm').reset();
    setDefaultDate();
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveData();
        updateUI();
        renderHistory();
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
                <span class="expense-amount">-${formatCurrency(expense.amount)}</span>
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
    const currentBudget = getMonthBudget();

    budgetInput.value = currentBudget > 0 ? currentBudget : '';
    updateMonthDisplay();
    modal.classList.add('show');
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    modal.classList.remove('show');
}

function setBudgetValue(value) {
    document.getElementById('budgetAmount').value = value;
}

function saveBudget() {
    const budgetInput = document.getElementById('budgetAmount');
    const amount = parseFloat(budgetInput.value) || 0;
    const key = getMonthKey();

    if (amount > 0) {
        budgets[key] = amount;
    } else {
        delete budgets[key];
    }

    saveData();
    updateUI();
    renderHistory();
    closeBudgetModal();
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
