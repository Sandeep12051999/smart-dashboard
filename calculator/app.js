// Calculator App

let currentValue = '0';
let previousValue = '';
let operator = null;
let shouldResetCurrent = false;
let history = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    renderHistory();

    // Keyboard support
    document.addEventListener('keydown', handleKeyboard);
});

// Handle keyboard input
function handleKeyboard(e) {
    if (e.key >= '0' && e.key <= '9') {
        appendNumber(e.key);
    } else if (e.key === '.') {
        appendNumber('.');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        appendOperator(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
    } else if (e.key === 'Escape') {
        clearAll();
    } else if (e.key === 'Backspace') {
        deleteLast();
    } else if (e.key === '%') {
        appendOperator('%');
    }
}

// Append number to display
function appendNumber(num) {
    if (shouldResetCurrent) {
        currentValue = num;
        shouldResetCurrent = false;
    } else {
        if (num === '.' && currentValue.includes('.')) return;
        if (currentValue === '0' && num !== '.') {
            currentValue = num;
        } else {
            currentValue += num;
        }
    }
    updateDisplay();
}

// Append operator
function appendOperator(op) {
    if (operator !== null && !shouldResetCurrent) {
        calculate();
    }

    if (op === '%') {
        currentValue = (parseFloat(currentValue) / 100).toString();
        updateDisplay();
        return;
    }

    operator = op;
    previousValue = currentValue;
    shouldResetCurrent = true;
    updateDisplay();
}

// Calculate result
function calculate() {
    if (operator === null || shouldResetCurrent) return;

    const prev = parseFloat(previousValue);
    const curr = parseFloat(currentValue);
    let result;

    switch (operator) {
        case '+':
            result = prev + curr;
            break;
        case '-':
            result = prev - curr;
            break;
        case '*':
            result = prev * curr;
            break;
        case '/':
            if (curr === 0) {
                alert('Cannot divide by zero!');
                return;
            }
            result = prev / curr;
            break;
        default:
            return;
    }

    // Format result
    result = Math.round(result * 1000000000) / 1000000000;

    // Add to history
    const expression = `${previousValue} ${getOperatorSymbol(operator)} ${currentValue}`;
    addToHistory(expression, result.toString());

    currentValue = result.toString();
    previousValue = '';
    operator = null;
    shouldResetCurrent = true;
    updateDisplay();
}

// Get display symbol for operator
function getOperatorSymbol(op) {
    switch (op) {
        case '*': return '×';
        case '/': return '÷';
        case '-': return '−';
        default: return op;
    }
}

// Clear all
function clearAll() {
    currentValue = '0';
    previousValue = '';
    operator = null;
    shouldResetCurrent = false;
    updateDisplay();
}

// Delete last character
function deleteLast() {
    if (currentValue.length === 1 || (currentValue.length === 2 && currentValue[0] === '-')) {
        currentValue = '0';
    } else {
        currentValue = currentValue.slice(0, -1);
    }
    updateDisplay();
}

// Update display
function updateDisplay() {
    document.getElementById('current').textContent = formatNumber(currentValue);

    if (operator !== null) {
        document.getElementById('previous').textContent =
            `${formatNumber(previousValue)} ${getOperatorSymbol(operator)}`;
    } else {
        document.getElementById('previous').textContent = '';
    }
}

// Format number for display
function formatNumber(num) {
    if (num.length > 12) {
        return parseFloat(num).toExponential(6);
    }
    return num;
}

// Add to history
function addToHistory(expression, result) {
    history.unshift({ expression, result });
    if (history.length > 20) {
        history.pop();
    }
    saveHistory();
    renderHistory();
}

// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem('calcHistory');
    if (saved) {
        history = JSON.parse(saved);
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('calcHistory', JSON.stringify(history));
}

// Render history
function renderHistory() {
    const container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = '<p class="empty-history">No calculations yet</p>';
        return;
    }

    container.innerHTML = history.map((item, index) => `
        <div class="history-item" onclick="useHistoryResult(${index})">
            <div class="history-expression">${item.expression} =</div>
            <div class="history-result">${item.result}</div>
        </div>
    `).join('');
}

// Use history result
function useHistoryResult(index) {
    currentValue = history[index].result;
    shouldResetCurrent = true;
    updateDisplay();
}

// Clear history
function clearHistory() {
    if (confirm('Clear all history?')) {
        history = [];
        saveHistory();
        renderHistory();
    }
}
