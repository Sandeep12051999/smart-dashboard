// English Speaking Practice App - Main JavaScript

// ============ Configuration ============
const CONFIG = {
    ollamaUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    voiceSpeed: 1,
    autoSpeak: true,
    showHindi: true
};

// ============ State Management ============
let isListening = false;
let recognition = null;
let synthesis = window.speechSynthesis;
let conversationHistory = [];
let currentModule = 'interview';
let lastAIResponse = '';

// ============ Module Prompts ============
const MODULE_PROMPTS = {
    interview: {
        name: 'Technical Interview',
        systemPrompt: `You are an experienced technical interviewer at a top tech company.
        Your role is to:
        1. Ask technical questions (DSA, System Design, coding concepts)
        2. Evaluate the candidate's answers
        3. Provide feedback on their communication
        4. Correct any grammar mistakes in their English

        Format your responses as:
        - Your response/question
        - If there are grammar mistakes, include a "Grammar Correction" section
        - Include a "Hindi Explanation" for any corrections (in Hinglish)

        Start with a greeting and ask a technical question.`,
        starters: [
            "Let's start with a coding question. Can you explain how you would implement a binary search?",
            "Tell me about your experience with data structures. Which ones do you use most often?",
            "How would you design a URL shortening service like bit.ly?"
        ]
    },
    hr: {
        name: 'HR Interview',
        systemPrompt: `You are an HR interviewer conducting a behavioral interview.
        Your role is to:
        1. Ask HR/behavioral questions (Tell me about yourself, strengths, weaknesses, etc.)
        2. Evaluate communication skills and professionalism
        3. Correct any grammar mistakes in their English
        4. Help them improve their answers

        Format your responses as:
        - Your response/follow-up question
        - If there are grammar mistakes, include a "Grammar Correction" section
        - Include a "Hindi Explanation" for corrections (in Hinglish)

        Start with a common HR question.`,
        starters: [
            "Hello! Thank you for joining us today. Let's start with a classic - Tell me about yourself.",
            "What would you say are your greatest strengths?",
            "Where do you see yourself in 5 years?"
        ]
    },
    client: {
        name: 'Client Call',
        systemPrompt: `You are a client/stakeholder in a software project discussion.
        Your role is to:
        1. Discuss project requirements, timelines, and status updates
        2. Ask clarifying questions
        3. Simulate real client interactions
        4. Correct any grammar/professional communication mistakes

        Format your responses as:
        - Your response as the client
        - If there are grammar/communication mistakes, include a "Professional Communication Tip" section
        - Include "Hindi Explanation" for improvements (in Hinglish)

        Start by asking about project status or discussing a requirement.`,
        starters: [
            "Hi team, I wanted to check on the progress of the new feature we discussed last week.",
            "Can you walk me through the technical approach you're planning for the integration?",
            "I have some concerns about the timeline. Can we discuss the milestones?"
        ]
    },
    standup: {
        name: 'Daily Standup',
        systemPrompt: `You are a team lead facilitating a daily standup meeting.
        Your role is to:
        1. Listen to standup updates (what was done, what's planned, any blockers)
        2. Ask follow-up questions
        3. Help improve concise communication
        4. Correct any grammar mistakes

        Format your responses as:
        - Your response/follow-up
        - If there are grammar mistakes or communication can be more concise, include a "Communication Tip" section
        - Include "Hindi Explanation" for improvements (in Hinglish)

        Start by asking for their standup update.`,
        starters: [
            "Good morning! Let's start the standup. What did you work on yesterday?",
            "Your turn for the update. What's your focus for today?",
            "Any blockers you need help with?"
        ]
    },
    general: {
        name: 'General Conversation',
        systemPrompt: `You are a friendly English conversation partner helping someone practice spoken English.
        Your role is to:
        1. Have natural conversations on various topics
        2. Correct grammar mistakes gently
        3. Suggest better vocabulary and phrases
        4. Explain corrections in Hindi (Hinglish)

        Format your responses as:
        - Your natural conversational response
        - If there are grammar mistakes, include a "Grammar Correction" section
        - Include "Hindi Explanation" for corrections (in Hinglish)

        Be friendly, encouraging, and conversational.`,
        starters: [
            "Hi there! How's your day going? What have you been up to?",
            "Let's chat! What's something interesting that happened to you recently?",
            "Hello! What topics would you like to practice talking about today?"
        ]
    }
};

// ============ Initialize App ============
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
    loadSettings();
    setupModuleListeners();
    addWelcomeMessage();
});

// ============ Speech Recognition Setup ============
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        updateListeningUI(true);
    };

    recognition.onend = () => {
        isListening = false;
        updateListeningUI(false);
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }

        if (event.results[event.results.length - 1].isFinal) {
            handleUserInput(transcript);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isListening = false;
        updateListeningUI(false);

        if (event.error === 'not-allowed') {
            showError('Microphone access denied. Please allow microphone access in your browser settings.');
        }
    };
}

// ============ UI Functions ============
function updateListeningUI(listening) {
    const voiceBtn = document.getElementById('voiceBtn');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = statusIndicator.querySelector('.status-text');

    if (listening) {
        voiceBtn.classList.add('listening');
        voiceBtn.querySelector('.btn-text').textContent = 'Listening...';
        statusIndicator.classList.add('listening');
        statusText.textContent = '🎤 Listening...';
    } else {
        voiceBtn.classList.remove('listening');
        voiceBtn.querySelector('.btn-text').textContent = 'Hold to Speak';
        statusIndicator.classList.remove('listening');
        statusText.textContent = 'Ready to listen';
    }
}

function addWelcomeMessage() {
    const module = MODULE_PROMPTS[currentModule];
    const starter = module.starters[Math.floor(Math.random() * module.starters.length)];

    addMessage('ai', starter);
    lastAIResponse = starter;

    if (CONFIG.autoSpeak) {
        speakText(starter);
    }

    conversationHistory.push({
        role: 'assistant',
        content: starter
    });
}

function addMessage(sender, text, correction = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    let html = `
        <div class="message-label">${sender === 'user' ? '👤 You' : '🤖 AI Tutor'}</div>
        <div class="message-bubble">
            <div class="message-text">${formatText(text)}</div>
    `;

    if (correction) {
        html += `
            <div class="correction">
                <div class="correction-header">📝 Grammar Correction</div>
                <div><span class="original">${correction.original}</span></div>
                <div>→ <span class="corrected">${correction.corrected}</span></div>
                ${CONFIG.showHindi && correction.hindi ? `
                    <div class="hindi-explanation">
                        <div class="hindi-label">🇮🇳 Hindi mein:</div>
                        ${correction.hindi}
                    </div>
                ` : ''}
            </div>
        `;
    }

    html += '</div>';
    messageDiv.innerHTML = html;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-label">🤖 AI Tutor</div>
        <div class="message-bubble">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

function showError(message) {
    const chatMessages = document.getElementById('chatMessages');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// ============ Voice Controls ============
function toggleListening() {
    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (e) {
            console.error('Could not start recognition:', e);
        }
    }
}

function speakText(text) {
    // Stop any ongoing speech
    synthesis.cancel();

    // Clean text for speech (remove markdown, special chars)
    const cleanText = text
        .replace(/\*\*/g, '')
        .replace(/###/g, '')
        .replace(/🇮🇳|📝|👤|🤖|💡/g, '')
        .replace(/Grammar Correction:|Hindi mein:|Communication Tip:/gi, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = CONFIG.voiceSpeed;
    utterance.pitch = 1;
    utterance.lang = 'en-US';

    // Try to get a good English voice
    const voices = synthesis.getVoices();
    const englishVoice = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    synthesis.speak(utterance);
}

function speakLastResponse() {
    if (lastAIResponse) {
        speakText(lastAIResponse);
    }
}

// ============ Input Handling ============
function handleUserInput(text) {
    if (!text.trim()) return;

    addMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    processWithAI(text);
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendTextMessage();
    }
}

function sendTextMessage() {
    const input = document.getElementById('textInput');
    const text = input.value.trim();

    if (text) {
        handleUserInput(text);
        input.value = '';
    }
}

// ============ AI Processing ============
async function processWithAI(userText) {
    addTypingIndicator();

    const backend = document.getElementById('aiBackend').value;

    try {
        let response;
        if (backend === 'ollama') {
            response = await processWithOllama(userText);
        } else {
            response = processWithBrowserAI(userText);
        }

        removeTypingIndicator();

        // Parse response for corrections
        const parsed = parseAIResponse(response);
        addMessage('ai', parsed.mainResponse, parsed.correction);

        lastAIResponse = parsed.mainResponse;

        conversationHistory.push({ role: 'assistant', content: response });

        if (CONFIG.autoSpeak) {
            speakText(parsed.mainResponse);
        }

    } catch (error) {
        removeTypingIndicator();
        console.error('AI processing error:', error);
        showError(`AI Error: ${error.message}. Make sure Ollama is running on localhost:11434`);
    }
}

async function processWithOllama(userText) {
    const model = document.getElementById('ollamaModel').value;
    const module = MODULE_PROMPTS[currentModule];

    const messages = [
        { role: 'system', content: module.systemPrompt },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userText }
    ];

    const response = await fetch(`${CONFIG.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: messages,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
}

function processWithBrowserAI(userText) {
    // Simple rule-based fallback when no AI backend
    const corrections = detectGrammarIssues(userText);

    let response = getSimpleResponse(userText, currentModule);

    if (corrections.length > 0) {
        response += '\n\n**Grammar Correction:**\n';
        corrections.forEach(c => {
            response += `• "${c.original}" → "${c.corrected}"\n`;
            response += `  Hindi mein: ${c.hindi}\n`;
        });
    }

    return response;
}

// ============ Grammar Detection (Fallback) ============
function detectGrammarIssues(text) {
    const corrections = [];
    const rules = [
        {
            pattern: /\bi\s+(?!am|have|was|will|would|could|should|had|do|don't|didn't|can|can't)/gi,
            check: (match) => match.toLowerCase() === 'i ',
            original: (match) => match,
            corrected: 'I ',
            hindi: '"I" hamesha capital letter mein likhte hain'
        },
        {
            pattern: /\b(he|she|it)\s+(have)\b/gi,
            original: (match) => match,
            corrected: (match) => match.replace('have', 'has'),
            hindi: 'He/She/It ke saath "has" use karte hain, "have" nahi'
        },
        {
            pattern: /\bi\s+is\b/gi,
            original: (match) => match,
            corrected: 'I am',
            hindi: '"I" ke saath "am" use karte hain, "is" nahi'
        },
        {
            pattern: /\byesterday\s+i\s+(go|work|do|make|come)\b/gi,
            original: (match) => match,
            corrected: (match) => match.replace(/(go|work|do|make|come)/, (verb) => {
                const past = { go: 'went', work: 'worked', do: 'did', make: 'made', come: 'came' };
                return past[verb] || verb + 'ed';
            }),
            hindi: 'Yesterday ke saath past tense use karte hain'
        },
        {
            pattern: /\b(dont|didnt|cant|wont|shouldnt|couldnt|wouldnt)\b/gi,
            original: (match) => match,
            corrected: (match) => match.replace(/(\w+)/, (word) => {
                const corrected = {
                    'dont': "don't", 'didnt': "didn't", 'cant': "can't",
                    'wont': "won't", 'shouldnt': "shouldn't",
                    'couldnt': "couldn't", 'wouldnt': "wouldn't"
                };
                return corrected[word.toLowerCase()] || word;
            }),
            hindi: 'Contraction mein apostrophe ( \' ) lagana zaroori hai'
        }
    ];

    rules.forEach(rule => {
        const matches = text.match(rule.pattern);
        if (matches) {
            matches.forEach(match => {
                if (!rule.check || rule.check(match)) {
                    corrections.push({
                        original: typeof rule.original === 'function' ? rule.original(match) : match,
                        corrected: typeof rule.corrected === 'function' ? rule.corrected(match) : rule.corrected,
                        hindi: rule.hindi
                    });
                }
            });
        }
    });

    return corrections;
}

function getSimpleResponse(text, module) {
    const responses = {
        interview: [
            "That's an interesting approach. Can you explain the time complexity?",
            "Good explanation. What edge cases would you consider?",
            "How would you optimize this solution further?"
        ],
        hr: [
            "Thank you for sharing that. Can you give me a specific example?",
            "That's a good point. How did that experience shape your career?",
            "Interesting. What did you learn from that situation?"
        ],
        client: [
            "I understand. What's the expected timeline for this?",
            "Thanks for the update. Are there any risks we should be aware of?",
            "Good progress. When can we schedule a demo?"
        ],
        standup: [
            "Thanks for the update. Any blockers?",
            "Good work. What's your priority for today?",
            "Noted. Do you need any help with that task?"
        ],
        general: [
            "That's interesting! Tell me more about that.",
            "I see. How did that make you feel?",
            "That's a great topic to practice! Let's continue."
        ]
    };

    const moduleResponses = responses[module] || responses.general;
    return moduleResponses[Math.floor(Math.random() * moduleResponses.length)];
}

// ============ AI Response Parsing ============
function parseAIResponse(response) {
    let mainResponse = response;
    let correction = null;

    // Try to extract correction section
    const correctionMatch = response.match(/(?:Grammar Correction|Communication Tip|Professional Communication Tip)[:\s]*\n?([\s\S]*?)(?=\n\n|Hindi|$)/i);
    const hindiMatch = response.match(/(?:Hindi mein|Hindi Explanation|हिंदी)[:\s]*\n?([\s\S]*?)$/i);

    if (correctionMatch) {
        // Extract original and corrected from the correction text
        const correctionText = correctionMatch[1];
        const originalMatch = correctionText.match(/["']([^"']+)["']\s*(?:→|->|should be|to)\s*["']([^"']+)["']/);

        if (originalMatch) {
            correction = {
                original: originalMatch[1],
                corrected: originalMatch[2],
                hindi: hindiMatch ? hindiMatch[1].trim() : null
            };
        }

        // Remove correction section from main response
        mainResponse = response
            .replace(/(?:Grammar Correction|Communication Tip|Professional Communication Tip)[:\s]*[\s\S]*$/i, '')
            .trim();
    }

    return { mainResponse, correction };
}

// ============ Module Management ============
function setupModuleListeners() {
    const moduleButtons = document.querySelectorAll('.module-btn');

    moduleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            moduleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentModule = btn.dataset.module;
            startNewTopic();
        });
    });
}

function startNewTopic() {
    // Clear chat
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';

    // Reset conversation
    conversationHistory = [];

    // Add new welcome message
    addWelcomeMessage();
}

// ============ Settings Management ============
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('show');
}

function loadSettings() {
    const saved = localStorage.getItem('englishPracticeSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        CONFIG.voiceSpeed = settings.voiceSpeed || 1;
        CONFIG.autoSpeak = settings.autoSpeak !== false;
        CONFIG.showHindi = settings.showHindi !== false;

        document.getElementById('voiceSpeed').value = CONFIG.voiceSpeed;
        document.getElementById('speedValue').textContent = CONFIG.voiceSpeed + 'x';
        document.getElementById('autoSpeak').checked = CONFIG.autoSpeak;
        document.getElementById('showHindi').checked = CONFIG.showHindi;

        if (settings.aiBackend) {
            document.getElementById('aiBackend').value = settings.aiBackend;
        }
        if (settings.ollamaModel) {
            document.getElementById('ollamaModel').value = settings.ollamaModel;
        }
    }

    // Voice speed slider
    document.getElementById('voiceSpeed').addEventListener('input', (e) => {
        CONFIG.voiceSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = CONFIG.voiceSpeed + 'x';
    });
}

function saveSettings() {
    CONFIG.voiceSpeed = parseFloat(document.getElementById('voiceSpeed').value);
    CONFIG.autoSpeak = document.getElementById('autoSpeak').checked;
    CONFIG.showHindi = document.getElementById('showHindi').checked;

    const settings = {
        voiceSpeed: CONFIG.voiceSpeed,
        autoSpeak: CONFIG.autoSpeak,
        showHindi: CONFIG.showHindi,
        aiBackend: document.getElementById('aiBackend').value,
        ollamaModel: document.getElementById('ollamaModel').value
    };

    localStorage.setItem('englishPracticeSettings', JSON.stringify(settings));
    toggleSettings();

    // Show confirmation
    alert('Settings saved!');
}

function closeAnalysis() {
    document.getElementById('analysisPanel').classList.remove('show');
}

// ============ Keyboard Shortcuts ============
document.addEventListener('keydown', (e) => {
    // Space bar to toggle voice (when not typing)
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        toggleListening();
    }

    // Escape to stop speech
    if (e.code === 'Escape') {
        synthesis.cancel();
    }
});

// Load voices when available
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
    };
}
