// Scientific Calculator App

// State
let currentValue = '0';
let expression = '';
let memory = 0;
let angleMode = 'deg'; // 'deg' or 'rad'
let history = [];
let shouldResetCurrent = false;
let lastResult = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    renderHistory();
    updateDisplay();
    document.addEventListener('keydown', handleKeyboard);
});

// Convert degrees to radians
function toRadians(angle) {
    return angleMode === 'deg' ? (angle * Math.PI) / 180 : angle;
}

// Convert radians to degrees
function toDegrees(angle) {
    return angleMode === 'deg' ? (angle * 180) / Math.PI : angle;
}

// Set angle mode
function setAngleMode(mode) {
    angleMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

// Handle keyboard input
function handleKeyboard(e) {
    const key = e.key;

    if (key >= '0' && key <= '9') {
        inputNumber(key);
    } else if (key === '.') {
        inputDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        inputOperator(key);
    } else if (key === '^') {
        inputOperator('^');
    } else if (key === '%') {
        inputOperator('%');
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
    } else if (key === 'Escape') {
        clearAll();
    } else if (key === 'Backspace') {
        backspace();
    } else if (key === '(' || key === ')') {
        inputBracket(key);
    }
}

// Input number
function inputNumber(num) {
    if (shouldResetCurrent) {
        currentValue = num;
        shouldResetCurrent = false;
    } else {
        if (currentValue === '0' && num !== '0') {
            currentValue = num;
        } else if (currentValue === '0' && num === '0') {
            // Keep single zero
        } else {
            currentValue += num;
        }
    }
    updateDisplay();
}

// Input decimal
function inputDecimal() {
    if (shouldResetCurrent) {
        currentValue = '0.';
        shouldResetCurrent = false;
    } else if (!currentValue.includes('.')) {
        currentValue += '.';
    }
    updateDisplay();
}

// Toggle sign
function toggleSign() {
    if (currentValue !== '0') {
        if (currentValue.startsWith('-')) {
            currentValue = currentValue.substring(1);
        } else {
            currentValue = '-' + currentValue;
        }
        updateDisplay();
    }
}

// Input operator
function inputOperator(op) {
    if (shouldResetCurrent && expression !== '') {
        // Replace last operator
        expression = expression.trim();
        const lastChar = expression.slice(-1);
        if (['+', '-', '*', '/', '^', '%'].includes(lastChar)) {
            expression = expression.slice(0, -1);
        }
    } else {
        expression += currentValue;
    }

    const displayOp = getOperatorSymbol(op);
    expression += ` ${displayOp} `;
    shouldResetCurrent = true;
    updateDisplay();
}

// Get display symbol for operator
function getOperatorSymbol(op) {
    const symbols = {
        '*': '×',
        '/': '÷',
        '-': '−',
        '+': '+',
        '^': '^',
        '%': 'mod'
    };
    return symbols[op] || op;
}

// Input bracket
function inputBracket(bracket) {
    if (bracket === '(') {
        if (shouldResetCurrent) {
            expression += '(';
        } else if (currentValue !== '0') {
            expression += currentValue + ' × (';
        } else {
            expression += '(';
        }
        currentValue = '0';
        shouldResetCurrent = true;
    } else {
        expression += currentValue + ')';
        shouldResetCurrent = true;
    }
    updateDisplay();
}

// Input function
function inputFunction(func) {
    let result;
    const num = parseFloat(currentValue);

    try {
        switch (func) {
            // Trigonometric
            case 'sin':
                result = Math.sin(toRadians(num));
                break;
            case 'cos':
                result = Math.cos(toRadians(num));
                break;
            case 'tan':
                result = Math.tan(toRadians(num));
                break;
            case 'asin':
                if (num < -1 || num > 1) throw new Error('Domain error');
                result = toDegrees(Math.asin(num));
                break;
            case 'acos':
                if (num < -1 || num > 1) throw new Error('Domain error');
                result = toDegrees(Math.acos(num));
                break;
            case 'atan':
                result = toDegrees(Math.atan(num));
                break;

            // Hyperbolic
            case 'sinh':
                result = Math.sinh(num);
                break;
            case 'cosh':
                result = Math.cosh(num);
                break;
            case 'tanh':
                result = Math.tanh(num);
                break;

            // Logarithmic
            case 'log':
                if (num <= 0) throw new Error('Domain error');
                result = Math.log10(num);
                break;
            case 'ln':
                if (num <= 0) throw new Error('Domain error');
                result = Math.log(num);
                break;

            // Powers and roots
            case 'sqrt':
                if (num < 0) throw new Error('Domain error');
                result = Math.sqrt(num);
                break;
            case 'cbrt':
                result = Math.cbrt(num);
                break;
            case 'square':
                result = num * num;
                break;
            case 'cube':
                result = num * num * num;
                break;
            case 'exp':
                result = Math.exp(num);
                break;
            case 'tenPow':
                result = Math.pow(10, num);
                break;
            case 'inverse':
                if (num === 0) throw new Error('Division by zero');
                result = 1 / num;
                break;

            // Other functions
            case 'factorial':
                if (num < 0 || !Number.isInteger(num)) throw new Error('Invalid input');
                if (num > 170) throw new Error('Overflow');
                result = factorial(num);
                break;
            case 'abs':
                result = Math.abs(num);
                break;
            case 'floor':
                result = Math.floor(num);
                break;
            case 'ceil':
                result = Math.ceil(num);
                break;
            case 'round':
                result = Math.round(num);
                break;
            case 'percent':
                result = num / 100;
                break;
            case 'rand':
                result = Math.random();
                break;

            default:
                return;
        }

        currentValue = formatResult(result);
        shouldResetCurrent = true;
        updateDisplay();

    } catch (error) {
        showError(error.message);
    }
}

// Calculate factorial
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Input constant
function inputConstant(constant) {
    switch (constant) {
        case 'pi':
            currentValue = Math.PI.toString();
            break;
        case 'e':
            currentValue = Math.E.toString();
            break;
    }
    shouldResetCurrent = true;
    updateDisplay();
}

// Calculate result
function calculate() {
    if (expression === '' && lastResult === null) return;

    let fullExpression = expression + currentValue;

    try {
        // Convert display expression to evaluable expression
        let evalExpression = fullExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/mod/g, '%')
            .replace(/\^/g, '**');

        // Evaluate
        const result = Function('"use strict"; return (' + evalExpression + ')')();

        if (!isFinite(result)) {
            throw new Error('Math error');
        }

        const formattedResult = formatResult(result);

        // Add to history
        addToHistory(fullExpression, formattedResult);

        lastResult = result;
        currentValue = formattedResult;
        expression = '';
        shouldResetCurrent = true;

        updateDisplay();

    } catch (error) {
        showError('Error');
    }
}

// Format result
function formatResult(num) {
    if (!isFinite(num)) return 'Error';

    // Handle very small numbers
    if (Math.abs(num) < 1e-10 && num !== 0) {
        return num.toExponential(6);
    }

    // Handle very large numbers
    if (Math.abs(num) >= 1e12) {
        return num.toExponential(6);
    }

    // Round to avoid floating point errors
    const rounded = Math.round(num * 1e10) / 1e10;

    // Convert to string and limit decimal places
    let str = rounded.toString();

    if (str.includes('.') && str.split('.')[1].length > 10) {
        str = rounded.toFixed(10).replace(/\.?0+$/, '');
    }

    return str;
}

// Show error
function showError(message) {
    const resultEl = document.getElementById('result');
    resultEl.textContent = message;
    resultEl.classList.add('error');

    setTimeout(() => {
        resultEl.classList.remove('error');
        clearAll();
    }, 1500);
}

// Clear all
function clearAll() {
    currentValue = '0';
    expression = '';
    shouldResetCurrent = false;
    updateDisplay();
}

// Backspace / Clear Entry
function backspace() {
    if (currentValue.length === 1 || (currentValue.length === 2 && currentValue[0] === '-')) {
        currentValue = '0';
    } else {
        currentValue = currentValue.slice(0, -1);
    }
    updateDisplay();
}

// Memory functions
function memoryClear() {
    memory = 0;
    updateMemoryIndicator();
}

function memoryRecall() {
    currentValue = memory.toString();
    shouldResetCurrent = true;
    updateDisplay();
}

function memoryAdd() {
    memory += parseFloat(currentValue);
    updateMemoryIndicator();
}

function memorySubtract() {
    memory -= parseFloat(currentValue);
    updateMemoryIndicator();
}

function updateMemoryIndicator() {
    const indicator = document.getElementById('memoryIndicator');
    indicator.textContent = memory !== 0 ? `M: ${formatResult(memory)}` : '';
}

// Update display
function updateDisplay() {
    document.getElementById('expression').textContent = expression;

    const resultEl = document.getElementById('result');
    resultEl.classList.remove('error');

    // Format display number with thousand separators for readability
    let displayValue = currentValue;
    if (!currentValue.includes('e') && !currentValue.includes('E')) {
        const parts = currentValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        displayValue = parts.join('.');
    }

    resultEl.textContent = displayValue;
}

// History functions
function addToHistory(expr, result) {
    history.unshift({ expression: expr, result: result });
    if (history.length > 30) {
        history.pop();
    }
    saveHistory();
    renderHistory();
}

function loadHistory() {
    const saved = localStorage.getItem('sciCalcHistory');
    if (saved) {
        try {
            history = JSON.parse(saved);
        } catch (e) {
            history = [];
        }
    }
}

function saveHistory() {
    localStorage.setItem('sciCalcHistory', JSON.stringify(history));
}

function renderHistory() {
    const container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = '<p class="no-history">No calculations yet</p>';
        return;
    }

    container.innerHTML = history.map((item, index) => `
        <div class="history-item" onclick="useHistoryResult(${index})">
            <div class="history-expression">${item.expression} =</div>
            <div class="history-result">${item.result}</div>
        </div>
    `).join('');
}

function useHistoryResult(index) {
    currentValue = history[index].result.replace(/,/g, '');
    shouldResetCurrent = true;
    updateDisplay();
}

function clearHistory() {
    if (history.length === 0) return;
    if (confirm('Clear all history?')) {
        history = [];
        saveHistory();
        renderHistory();
    }
}
