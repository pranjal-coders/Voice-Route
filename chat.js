// ==================== VOICEROUTE ASSISTANT - DEDICATED CHAT SYSTEM ====================

console.log('🎤 VoiceRoute Assistant Chat System Loading...');

// Global Variables
let voiceChatHistory = [];
let currentVoiceRecognition = null;
let isVoiceListening = false;
let isVoiceProcessing = false;
let lastResponse = '';
let conversationId = null;

// Voice Settings
let voiceSettings = {
    language: 'en-IN',
    speed: 1.0,
    autoListen: false,
    soundEffects: true
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing VoiceRoute Assistant...');

    // Generate conversation ID
    conversationId = 'chat_' + Date.now();

    // Initialize voice recognition
    initializeVoiceRecognition();

    // Load settings and history
    loadVoiceSettings();
    loadChatHistory();

    // Setup event listeners  
    setupEventListeners();

    // Update UI
    updateVoiceStatus('ready', 'Ready to chat! Click the microphone to start.');

    console.log('✅ VoiceRoute Assistant initialized successfully!');
});

// ==================== VOICE RECOGNITION SETUP ====================

function initializeVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Voice recognition not supported in this browser');
        updateVoiceStatus('error', 'Voice recognition not supported. Please use Chrome or Firefox.');
        return;
    }

    try {
        if ('webkitSpeechRecognition' in window) {
            currentVoiceRecognition = new webkitSpeechRecognition();
        } else {
            currentVoiceRecognition = new SpeechRecognition();
        }

        // Configure recognition
        currentVoiceRecognition.continuous = false;
        currentVoiceRecognition.interimResults = true;
        currentVoiceRecognition.maxAlternatives = 1;
        currentVoiceRecognition.lang = voiceSettings.language;

        // Event handlers
        currentVoiceRecognition.onstart = handleVoiceStart;
        currentVoiceRecognition.onresult = handleVoiceResult;
        currentVoiceRecognition.onend = handleVoiceEnd;
        currentVoiceRecognition.onerror = handleVoiceError;

        console.log('✅ Voice recognition initialized');

    } catch (error) {
        console.error('❌ Voice recognition setup failed:', error);
        updateVoiceStatus('error', 'Voice recognition setup failed.');
    }
}

// ==================== VOICE RECOGNITION HANDLERS ====================

function handleVoiceStart() {
    console.log('🎤 Voice recognition started');
    updateVoiceStatus('listening', 'Listening... Speak now!');
    playSound('start');
}

function handleVoiceResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    // Process results
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
    }

    // Show interim results
    if (interimTranscript) {
        updateVoiceStatus('listening', `Hearing: "${interimTranscript}"`);
        updateStatusDetails(`Confidence: ${Math.round(event.results[0][0].confidence * 100)}%`);
    }

    // Process final transcript
    if (finalTranscript.trim()) {
        console.log('📝 Final transcript:', finalTranscript);
        processUserInput(finalTranscript.trim());
    }
}

function handleVoiceEnd() {
    console.log('🛑 Voice recognition ended');
    isVoiceListening = false;

    if (!isVoiceProcessing) {
        updateVoiceStatus('ready', 'Ready to chat! Click the microphone to start.');
        updateStatusDetails('');
    }

    updateVoiceUI('ready');
}

function handleVoiceError(event) {
    console.error('❌ Voice recognition error:', event.error);
    isVoiceListening = false;
    isVoiceProcessing = false;

    let errorMessage = '';
    let statusMessage = '';

    switch (event.error) {
        case 'no-speech':
            errorMessage = 'No speech detected';
            statusMessage = 'No speech was detected. Please try again.';
            break;
        case 'audio-capture':
            errorMessage = 'Microphone access failed';
            statusMessage = 'Could not access microphone. Please check permissions.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone permission denied';
            statusMessage = 'Please allow microphone access to use voice chat.';
            break;
        case 'network':
            errorMessage = 'Network error';
            statusMessage = 'Network error occurred. Please check your connection.';
            break;
        default:
            errorMessage = 'Voice recognition error';
            statusMessage = `Error: ${event.error}. Please try again.`;
    }

    updateVoiceStatus('error', statusMessage);
    addMessage('system', `🚫 ${errorMessage}: ${statusMessage}`);
    updateVoiceUI('ready');
    playSound('error');
}

// ==================== VOICE CONTROL FUNCTIONS ====================

function toggleVoiceRecognition() {
    if (!currentVoiceRecognition) {
        initializeVoiceRecognition();
        if (!currentVoiceRecognition) {
            addMessage('system', '❌ Voice recognition is not available. Please use the text input instead.');
            return;
        }
    }

    if (isVoiceListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    if (isVoiceProcessing) {
        console.log('⏳ Voice processing in progress, cannot start new recognition');
        return;
    }

    try {
        // Update settings
        currentVoiceRecognition.lang = voiceSettings.language;

        // Start recognition
        currentVoiceRecognition.start();
        isVoiceListening = true;

        // Update UI
        updateVoiceUI('listening');
        updateVoiceStatus('listening', 'Listening... Speak your query now!');

        console.log('✅ Voice recognition started successfully');

    } catch (error) {
        console.error('❌ Failed to start voice recognition:', error);
        updateVoiceStatus('error', 'Failed to start voice recognition. Please try again.');
        updateVoiceUI('ready');
    }
}

function stopVoiceRecognition() {
    if (currentVoiceRecognition && isVoiceListening) {
        try {
            currentVoiceRecognition.stop();
            console.log('🛑 Voice recognition stopped by user');
        } catch (error) {
            console.error('Error stopping voice recognition:', error);
        }
    }
}

// ==================== MESSAGE PROCESSING ====================

async function processUserInput(input) {
    if (!input || input.trim().length === 0) return;

    console.log('💬 Processing user input:', input);

    // Add user message
    addMessage('user', input);

    // Start processing
    isVoiceProcessing = true;
    updateVoiceUI('processing');
    updateVoiceStatus('processing', 'Processing your request...');
    showThinking();

    try {
        // Generate response
        const response = await generateResponse(input);

        // Hide thinking animation
        hideThinking();

        // Add assistant response
        addMessage('assistant', response);

        // Speak response
        if ('speechSynthesis' in window) {
            speakResponse(response);
        }

        // Store for replay
        lastResponse = response;

        // Auto-listen if enabled
        if (voiceSettings.autoListen) {
            setTimeout(() => {
                if (!isVoiceListening) {
                    startVoiceRecognition();
                }
            }, 2000);
        }

    } catch (error) {
        console.error('❌ Error processing user input:', error);
        hideThinking();

        const errorResponse = "I'm sorry, I encountered an error processing your request. Please try again or rephrase your question.";
        addMessage('assistant', errorResponse);
        speakResponse(errorResponse);

    } finally {
        isVoiceProcessing = false;
        updateVoiceUI('ready');
        updateVoiceStatus('ready', 'Ready for your next query!');
    }
}

// ==================== RESPONSE GENERATION ====================

async function fetchGeminiAIResponse(query) {
    const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    return data.reply || '[No AI response]';
}


// ==================== CHAT INTERFACE ====================

function addMessage(sender, text, timestamp = new Date()) {
    const messageId = Date.now() + Math.random();

    const message = {
        id: messageId,
        sender: sender,
        text: text,
        timestamp: timestamp,
        conversationId: conversationId
    };

    // Add to history
    voiceChatHistory.push(message);

    // Render message
    renderMessage(message);

    // Save to localStorage
    saveChatHistory();

    // Scroll to bottom
    scrollToBottom();

    // Play sound
    playSound(sender === 'user' ? 'send' : 'receive');
}

function renderMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // Remove welcome message if this is the first real message
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage && message.sender !== 'system') {
        welcomeMessage.style.display = 'none';
    }

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.sender}`;
    messageDiv.dataset.messageId = message.id;

    // Get sender info
    let senderInfo = getSenderInfo(message.sender);

    // Format timestamp
    const timeString = new Date(message.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // Create message HTML
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-header">
                <div class="sender-info">
                    <div class="sender-avatar">${senderInfo.icon}</div>
                    <span class="sender-name">${senderInfo.name}</span>
                </div>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-text">${formatMessageText(message.text)}</div>
            ${message.sender === 'assistant' ? `
                <div class="message-actions">
                    <button class="msg-action-btn" onclick="speakText('${message.text.replace(/'/g, "\'")}')">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="msg-action-btn" onclick="copyText('${message.text.replace(/'/g, "\'")}')">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    chatMessages.appendChild(messageDiv);

    // Animate in
    setTimeout(() => {
        messageDiv.classList.add('animate-in');
    }, 50);
}

function getSenderInfo(sender) {
    switch (sender) {
        case 'user':
            return { icon: '<i class="fas fa-user"></i>', name: 'You' };
        case 'assistant':
            return { icon: '<i class="fas fa-robot"></i>', name: 'VoiceRoute Assistant' };
        case 'system':
            return { icon: '<i class="fas fa-info-circle"></i>', name: 'System' };
        default:
            return { icon: '<i class="fas fa-question"></i>', name: 'Unknown' };
    }
}

function formatMessageText(text) {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

// ==================== TEXT INPUT ====================

function toggleTextInput() {
    const textInputArea = document.getElementById('textInputArea');
    const textInput = document.getElementById('textInput');

    if (textInputArea.style.display === 'none') {
        textInputArea.style.display = 'block';
        textInput.focus();
        textInput.placeholder = 'Type your message here...';
    } else {
        hideTextInput();
    }
}

function hideTextInput() {
    const textInputArea = document.getElementById('textInputArea');
    const textInput = document.getElementById('textInput');

    textInputArea.style.display = 'none';
    textInput.value = '';
}

function sendTextMessage() {
    const textInput = document.getElementById('textInput');
    const message = textInput.value.trim();

    if (message) {
        processUserInput(message);
        textInput.value = '';
        hideTextInput();
    }
}

function handleTextKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendTextMessage();
    }
}

// ==================== TEXT-TO-SPEECH ====================

function speakResponse(text) {
    if (!('speechSynthesis' in window) || !text) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Clean text for speech
    const cleanText = text.replace(/[*_#\n]/g, '').replace(/\n/g, ' ');

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voiceSettings.speed;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use appropriate voice
    const voices = speechSynthesis.getVoices();
    let selectedVoice = null;

    // Look for Indian English voice
    if (voiceSettings.language.includes('en-IN')) {
        selectedVoice = voices.find(voice => voice.lang.includes('en-IN'));
    }

    // Fallback to any English voice
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.includes('en'));
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    // Event handlers
    utterance.onstart = () => {
        updateVoiceStatus('speaking', '🔊 Speaking response...');
    };

    utterance.onend = () => {
        updateVoiceStatus('ready', 'Ready for your next query!');
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        updateVoiceStatus('ready', 'Ready for your next query!');
    };

    // Speak
    speechSynthesis.speak(utterance);
}

function speakText(text) {
    speakResponse(text);
}

function replayLastResponse() {
    if (lastResponse) {
        speakResponse(lastResponse);
        updateVoiceStatus('speaking', '🔊 Replaying last response...');
    } else {
        updateVoiceStatus('ready', 'No previous response to replay.');
        setTimeout(() => {
            updateVoiceStatus('ready', 'Ready for your next query!');
        }, 2000);
    }
}

// ==================== UI UPDATES ====================

function updateVoiceUI(state) {
    const voiceMainBtn = document.getElementById('voiceMainBtn');
    const voiceIcon = document.getElementById('voiceIcon');
    const voiceText = document.getElementById('voiceText');
    const voiceCircle = document.getElementById('voiceCircle');
    const voiceBars = document.getElementById('voiceBars');
    const statusIndicator = document.getElementById('statusIndicator');

    // Remove all state classes
    if (voiceMainBtn) voiceMainBtn.className = 'voice-main-btn';
    if (voiceCircle) voiceCircle.className = 'voice-circle';
    if (voiceBars) voiceBars.className = 'voice-bars';
    if (statusIndicator) statusIndicator.className = 'status-indicator';

    // Apply state-specific styling
    switch (state) {
        case 'listening':
            if (voiceMainBtn) voiceMainBtn.classList.add('listening');
            if (voiceIcon) voiceIcon.className = 'fas fa-stop';
            if (voiceText) voiceText.textContent = 'Stop Listening';
            if (voiceCircle) voiceCircle.classList.add('listening');
            if (voiceBars) voiceBars.classList.add('active');
            if (statusIndicator) statusIndicator.classList.add('listening');
            break;

        case 'processing':
            if (voiceMainBtn) voiceMainBtn.classList.add('processing');
            if (voiceIcon) voiceIcon.className = 'fas fa-spinner fa-spin';
            if (voiceText) voiceText.textContent = 'Processing...';
            if (voiceCircle) voiceCircle.classList.add('processing');
            if (statusIndicator) statusIndicator.classList.add('processing');
            break;

        case 'speaking':
            if (voiceMainBtn) voiceMainBtn.classList.add('speaking');
            if (voiceIcon) voiceIcon.className = 'fas fa-volume-up';
            if (voiceText) voiceText.textContent = 'Speaking...';
            if (statusIndicator) statusIndicator.classList.add('speaking');
            break;

        default: // ready
            if (voiceIcon) voiceIcon.className = 'fas fa-microphone';
            if (voiceText) voiceText.textContent = 'Start Speaking';
            if (statusIndicator) statusIndicator.classList.add('ready');
            break;
    }
}

function updateVoiceStatus(state, message) {
    const statusText = document.getElementById('voiceStatusText');
    const chatStatus = document.getElementById('chatStatus');
    const statusTextSpan = chatStatus?.querySelector('span');

    if (statusText) {
        statusText.textContent = message;
    }

    if (statusTextSpan) {
        let shortMessage = '';
        switch (state) {
            case 'listening':
                shortMessage = 'Listening...';
                break;
            case 'processing':
                shortMessage = 'Processing...';
                break;
            case 'speaking':
                shortMessage = 'Speaking...';
                break;
            default:
                shortMessage = 'Ready to chat';
        }
        statusTextSpan.textContent = shortMessage;
    }
}

function updateStatusDetails(message) {
    const statusDetails = document.getElementById('statusDetails');
    if (statusDetails) {
        statusDetails.textContent = message;
    }
}

function showThinking() {
    const overlay = document.getElementById('thinkingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }
}

function hideThinking() {
    const overlay = document.getElementById('thinkingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ==================== SETTINGS ====================

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
}

function setupEventListeners() {
    // Voice language change
    const languageSelect = document.getElementById('voiceLanguage');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            voiceSettings.language = e.target.value;
            if (currentVoiceRecognition) {
                currentVoiceRecognition.lang = voiceSettings.language;
            }
            saveVoiceSettings();
        });
    }

    // Voice speed change
    const speedSlider = document.getElementById('voiceSpeed');
    const speedValue = document.getElementById('speedValue');
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            voiceSettings.speed = parseFloat(e.target.value);
            speedValue.textContent = voiceSettings.speed.toFixed(1) + 'x';
            saveVoiceSettings();
        });
    }

    // Auto-listen toggle
    const autoListen = document.getElementById('autoListen');
    if (autoListen) {
        autoListen.addEventListener('change', (e) => {
            voiceSettings.autoListen = e.target.checked;
            saveVoiceSettings();
        });
    }

    // Sound effects toggle
    const soundEffects = document.getElementById('soundEffects');
    if (soundEffects) {
        soundEffects.addEventListener('change', (e) => {
            voiceSettings.soundEffects = e.target.checked;
            saveVoiceSettings();
        });
    }

    // Mobile menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// ==================== DATA PERSISTENCE ====================

function saveVoiceSettings() {
    localStorage.setItem('voiceRoute_voiceSettings', JSON.stringify(voiceSettings));
}

function loadVoiceSettings() {
    const saved = localStorage.getItem('voiceRoute_voiceSettings');
    if (saved) {
        try {
            voiceSettings = { ...voiceSettings, ...JSON.parse(saved) };

            // Apply to UI
            const languageSelect = document.getElementById('voiceLanguage');
            const speedSlider = document.getElementById('voiceSpeed');
            const speedValue = document.getElementById('speedValue');
            const autoListen = document.getElementById('autoListen');
            const soundEffects = document.getElementById('soundEffects');

            if (languageSelect) languageSelect.value = voiceSettings.language;
            if (speedSlider) speedSlider.value = voiceSettings.speed;
            if (speedValue) speedValue.textContent = voiceSettings.speed.toFixed(1) + 'x';
            if (autoListen) autoListen.checked = voiceSettings.autoListen;
            if (soundEffects) soundEffects.checked = voiceSettings.soundEffects;

        } catch (error) {
            console.error('Error loading voice settings:', error);
        }
    }
}

function saveChatHistory() {
    const recentHistory = voiceChatHistory.slice(-50); // Keep last 50 messages
    localStorage.setItem('voiceRoute_chatHistory', JSON.stringify(recentHistory));
}

function loadChatHistory() {
    const saved = localStorage.getItem('voiceRoute_chatHistory');
    if (saved) {
        try {
            const history = JSON.parse(saved);
            // Render previous messages
            history.forEach(message => {
                voiceChatHistory.push(message);
                renderMessage(message);
            });

            if (history.length > 0) {
                // Hide welcome message if there's history
                const welcomeMessage = document.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('Error loading chat history:', error);
            voiceChatHistory = [];
        }
    }
}

function clearChatHistory() {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
        // Clear data
        voiceChatHistory = [];
        localStorage.removeItem('voiceRoute_chatHistory');

        // Clear UI
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="welcome-content">
                        <h3>Welcome to VoiceRoute Assistant! 🚀</h3>
                        <p>I'm here to help you find the best trains and buses across India. You can:</p>
                        <div class="welcome-features">
                            <div class="feature-item">
                                <i class="fas fa-microphone"></i>
                                <span>Speak naturally - I understand conversational queries</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-route"></i>
                                <span>Get real-time route information and schedules</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-language"></i>
                                <span>Chat in multiple Indian languages</span>
                            </div>
                        </div>
                        <div class="example-queries">
                            <p><strong>Try saying:</strong></p>
                            <button class="example-btn" onclick="processVoiceInput('Find trains from Delhi to Mumbai')">
                                "Find trains from Delhi to Mumbai"
                            </button>
                            <button class="example-btn" onclick="processVoiceInput('Show me buses to Bangalore tomorrow')">
                                "Show me buses to Bangalore tomorrow"
                            </button>
                            <button class="example-btn" onclick="processVoiceInput('What is the cheapest way to reach Goa')">
                                "What's the cheapest way to reach Goa?"
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show confirmation
        addMessage('system', '✨ Chat history cleared! Ready for a fresh conversation.');
        playSound('clear');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function playSound(type) {
    if (!voiceSettings.soundEffects) return;

    // Create audio context for sound effects
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioContextClass = AudioContext || webkitAudioContext;
        const audioContext = new AudioContextClass();

        let frequency;
        let duration;

        switch (type) {
            case 'start':
                frequency = 800;
                duration = 0.1;
                break;
            case 'send':
                frequency = 600;
                duration = 0.1;
                break;
            case 'receive':
                frequency = 400;
                duration = 0.15;
                break;
            case 'error':
                frequency = 200;
                duration = 0.3;
                break;
            case 'clear':
                frequency = 1000;
                duration = 0.2;
                break;
            default:
                return;
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    }
}

function copyText(text) {
    const cleanText = text.replace(/[*_#]/g, '').replace(/\n/g, '\n');

    if (navigator.clipboard) {
        navigator.clipboard.writeText(cleanText).then(() => {
            updateVoiceStatus('ready', '✅ Message copied to clipboard!');
            setTimeout(() => {
                updateVoiceStatus('ready', 'Ready for your next query!');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }
}

// ==================== INITIALIZATION COMPLETE ====================

console.log('✅ VoiceRoute Assistant Chat System Ready!');
console.log('🎤 Voice recognition initialized');
console.log('💬 Chat interface ready'); 
console.log('⚙️ Settings loaded');
console.log('🚀 Ready to help with your travel queries!');
