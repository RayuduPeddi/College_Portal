import { useState, useEffect, useRef } from 'react';
import '../styles/AIAssistant.css';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: '🚀 Yo! I\'m your **CampusConnect AI** buddy! Ready to help with notices, emails, study plans, or anything academic. What\'s on your mind? 🧠',
      createdAt: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');

  // Suggestions depending on the user's role
  const suggestions = [
    'Draft a notice about exams',
    'Write an email asking for leave',
    'Create a study schedule',
    'Explain portal features'
  ];

  // Cool error messages to display when something goes wrong
  const coolErrorMessages = [
    "🤔 Oops! My AI circuits got a little tangled. Let me catch my breath and try again!",
    "😅 Whoopsie! I had a little hiccup processing that. Mind giving it another shot?",
    "🚀 My engines are sputtering! Let's try that question once more.",
    "🎯 Looks like I missed the mark this time. Fancy another attempt?",
    "💫 I had a momentary lapse of logic. Let's give it another go!",
    "🌟 Hmm, that didn't go as planned. Ready to try again?",
    "⚡ I'm still waking up! Let me try that again for you.",
    "🎪 I tripped over my own code there! Care to ask again?"
  ];

  const networkErrorMessages = [
    "📡 Looks like the connection took a coffee break! Check your internet and try again.",
    "🌐 Oops! My connection to the brain ended. Let's reconnect!",
    "⚠️ The digital highway has a detour. Verify your connection and retry!",
    "🔌 Network hiccup detected! Let's check your internet and try once more.",
    "📶 Signal loss! Make sure you're connected and try again.",
    "🛰️ The connection dropped! Let's reestablish and try that again."
  ];

  // Get a random cool error message
  const getRandomErrorMessage = (isNetworkError = false) => {
    const messages = isNetworkError ? networkErrorMessages : coolErrorMessages;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Simulates a typewriter typing effect for a response string
  const typeMessage = (fullText, messageId) => {
    setIsTyping(false);
    
    // Add an empty AI message that we will populate
    const newMsg = {
      id: messageId,
      sender: 'ai',
      text: '',
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, newMsg]);

    const words = fullText.split(' ');
    let currentWordIdx = 0;
    let currentText = '';

    const interval = setInterval(() => {
      if (currentWordIdx < words.length) {
        currentText += (currentWordIdx === 0 ? '' : ' ') + words[currentWordIdx];
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, text: currentText } : m))
        );
        currentWordIdx++;
      } else {
        clearInterval(interval);
      }
    }, 45); // Speed of typing words
  };

  const handleSend = async (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;

    // Add User Message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      createdAt: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: textToSend, apiKey })
      });

      const result = await response.json();
      if (result.success) {
        // Stream typing effect for AI answer
        typeMessage(result.text, 'ai-' + Date.now().toString());
      } else {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now().toString(),
            sender: 'ai',
            text: getRandomErrorMessage(false),
            createdAt: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const isNetworkError = err.message?.includes('fetch') || err instanceof TypeError;
      
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now().toString(),
          sender: 'ai',
          text: getRandomErrorMessage(isNetworkError),
          createdAt: new Date()
        }
      ]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(inputText);
  };

  // Render text containing custom markdown formats like bold and codeblocks
  const renderFormattedText = (text) => {
    if (!text) return '';

    // Simple markdown-to-HTML helper for UI
    const parts = [];
    const lines = text.split('\n');

    let isCodeBlock = false;
    let codeBlockContent = [];

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('```')) {
        if (isCodeBlock) {
          // Close code block
          parts.push(
            <pre key={`code-${idx}`}>
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          isCodeBlock = false;
        } else {
          isCodeBlock = true;
        }
        return;
      }

      if (isCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Process inline bold (**text**) and code (`code`)
      let processedLine = line;
      
      // Inline code
      const codeRegex = /`([^`]+)`/g;
      const boldRegex = /\*\*([^*]+)\*\*/g;

      // Replace bold and code with elements
      // To keep it simple, we check if bold or code is in line, and split it
      const lineParts = [];
      let lastIdx = 0;
      
      // Simple regex parser
      const combinedRegex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
      let match;
      
      while ((match = combinedRegex.exec(line)) !== null) {
        const matchIdx = match.index;
        // Text before match
        if (matchIdx > lastIdx) {
          lineParts.push(line.substring(lastIdx, matchIdx));
        }
        
        if (match[0].startsWith('**')) {
          lineParts.push(<strong key={`b-${matchIdx}`}>{match[2]}</strong>);
        } else if (match[0].startsWith('`')) {
          lineParts.push(<code key={`c-${matchIdx}`}>{match[3]}</code>);
        }
        
        lastIdx = combinedRegex.lastIndex;
      }
      
      if (lastIdx < line.length) {
        lineParts.push(line.substring(lastIdx));
      }

      parts.push(
        <p key={idx}>
          {lineParts.length > 0 ? lineParts : line}
        </p>
      );
    });

    if (isCodeBlock && codeBlockContent.length > 0) {
      parts.push(
        <pre key="code-unclosed">
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      );
    }

    return parts;
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-assistant-header">
        <div className="ai-header-title">
          <span>🤖</span>
          <h3>CampusConnet AI Assistant</h3>
        </div>
      </div>

      <div className="ai-messages-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-msg-row ${msg.sender}`}>
            <div className={`ai-avatar ${msg.sender}-avatar`}>
              {msg.sender === 'ai' ? '🤖' : '👤'}
            </div>
            <div className="ai-bubble">
              {renderFormattedText(msg.text)}
              <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '5px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="ai-msg-row ai">
            <div className="ai-avatar ai-avatar">🤖</div>
            <div className="ai-bubble">
              <div className="ai-typing-indicator">
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
                <div className="ai-typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="ai-suggestions-container">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            className="ai-chip"
            onClick={() => handleSend(s)}
            disabled={isTyping}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="ai-input-wrapper">
        <form onSubmit={handleSubmit} className="ai-input-form">
          <input
            type="text"
            className="ai-text-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI anything..."
            disabled={isTyping}
          />
          <button
            type="submit"
            className="ai-send-btn"
            disabled={!inputText.trim() || isTyping}
          >
            ➔
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
