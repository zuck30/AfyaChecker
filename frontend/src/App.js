import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiUser, FiGlobe, FiTrash2, FiMenu, FiX, FiCopy, FiCheck, FiMessageSquare, FiDownload, FiSearch, FiStar, FiShare2, FiRotateCcw, FiHeart, FiAlertTriangle, FiCheckCircle, FiPlus, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { IoMdFlash } from 'react-icons/io';
import './App.css';
import Logo from './images/purple.png';

function App() {
  const [symptoms, setSymptoms] = useState('');
  const [language, setLanguage] = useState('Swahili');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const quickPrompts = [
    { en: 'Fever and cough for 3 days', sw: 'Homa na kikohozi kwa siku 3' },
    { en: 'Headache and fatigue', sw: 'Maumivu ya kichwa na uchovu' },
    { en: 'Sore throat and fever', sw: 'Koo linawasha na homa' },
    { en: 'Stomach pain and nausea', sw: 'Maumivu ya tumbo na kichefuchefu' },
    { en: 'Chest pain and shortness of breath', sw: 'Maumivu ya kifua na kupumua kwa shida' },
    { en: 'Skin rash and itching', sw: 'Upele na kuwashwa ngozi' },
  ];

  // Load history and favorites from localStorage on component mount
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const savedFavorites = JSON.parse(localStorage.getItem('chatFavorites')) || [];
    
    // Ensure all history items have required properties
    const validatedHistory = savedHistory.map(item => ({
      id: item.id || Date.now() + Math.random(),
      type: item.type || 'user',
      content: item.content || '',
      timestamp: item.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: item.fullTimestamp || new Date().toLocaleString(),
      language: item.language || 'Swahili',
      isFavorite: item.isFavorite || false
    }));
    
    setChatHistory(validatedHistory);
    setFavorites(savedFavorites);
  }, []);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError(language === 'Swahili' ? 'Tafadhali weka dalili.' : 'Please enter symptoms.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: symptoms,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: new Date().toLocaleString(),
      language,
      isFavorite: false
    };
    
    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    
    const currentSymptoms = symptoms;
    setSymptoms('');

    try {
      // Simulate API call - replace with your actual endpoint
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms: currentSymptoms, language }),
      });
      
      let analysisText;
      if (response.ok) {
        const data = await response.json();
        analysisText = data.analysis || data.error;
      } else {
        throw new Error('API request failed');
      }

      // If no analysis from API, provide a better default response
      if (!analysisText || analysisText.includes('Hakuna uchambuzi') || analysisText.includes('No analysis')) {
        analysisText = language === 'Swahili' 
          ? `Nimeelewa dalili zako: "${currentSymptoms}". Kwa sasa, ninaomba ueleze zaidi kuhusu hali yako ili nikupe ushauri sahihi zaidi. Unaweza pia kushiriki:\n\n• Muda umekuwa na dalili hizi\n• Ukali wa dalili\n• Dalili zingine unazohisi\n\nKumbuka: Huu ni ushauri wa awali tu. Kwa matibabu kamili, tafadhali wasiliana na mtaalamu wa afya.`
          : `I understand your symptoms: "${currentSymptoms}". Currently, I need more details about your condition to provide better advice. You can also share:\n\n• How long you've had these symptoms\n• Severity of symptoms\n• Any other symptoms you're experiencing\n\nRemember: This is preliminary advice only. For complete medical care, please consult a healthcare professional.`;
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: analysisText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTimestamp: new Date().toLocaleString(),
        language
      };
      
      const finalHistory = [...updatedHistory, botMessage];
      setChatHistory(finalHistory);
      localStorage.setItem('chatHistory', JSON.stringify(finalHistory));
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: language === 'Swahili' ? 
          'Hitilafu imetokea. Tafadhali jaribu tena.' : 
          'An error occurred. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTimestamp: new Date().toLocaleString(),
        language
      };
      
      const finalHistory = [...updatedHistory, errorMessage];
      setChatHistory(finalHistory);
      localStorage.setItem('chatHistory', JSON.stringify(finalHistory));
    }
    setLoading(false);
  };

  const handleQuickPrompt = (prompt) => {
    setSymptoms(language === 'Swahili' ? prompt.sw : prompt.en);
    setError('');
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleAnalyze();
    } else if (e.key === 'Escape') {
      setSymptoms('');
      setError('');
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    setFavorites([]);
    localStorage.removeItem('chatFavorites');
    setShowClearModal(false);
    setError('');
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const newChat = () => {
    setChatHistory([]);
    setSymptoms('');
    setError('');
    setSidebarOpen(false);
  };

  const toggleFavorite = (id, e) => {
    e?.stopPropagation();
    const updatedHistory = chatHistory.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setChatHistory(updatedHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    
    const updatedFavorites = updatedHistory.filter(item => item.isFavorite);
    setFavorites(updatedFavorites);
    localStorage.setItem('chatFavorites', JSON.stringify(updatedFavorites));
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(chatHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'health_assistant_history.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareChat = () => {
    const latestUserMessage = chatHistory.find(msg => msg.type === 'user');
    const latestBotMessage = chatHistory.find(msg => msg.type === 'bot');
    
    if (navigator.share) {
      navigator.share({
        title: 'Health Assistant Chat',
        text: `${latestUserMessage?.content || ''}\n\n${latestBotMessage?.content || ''}`,
        url: window.location.href,
      });
    } else {
      const text = `${language === 'Swahili' ? 'Msaidizi wa Afya' : 'Health Assistant'}\n\n${latestUserMessage?.content || ''}\n\n${latestBotMessage?.content || ''}`;
      navigator.clipboard.writeText(text);
      setCopiedMessageId('share');
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const regenerateResponse = () => {
    const lastUserMessage = chatHistory.find(msg => msg.type === 'user');
    if (lastUserMessage) {
      setSymptoms(lastUserMessage.content);
      setTimeout(() => handleAnalyze(), 100);
    }
  };

  const handleHistoryClick = (item) => {
    if (item.type === 'user') {
      setSymptoms(item.content);
    }
    setSidebarOpen(false);
  };

  // Safe filtering functions
  const filteredHistory = chatHistory.filter(item => {
    if (!item || typeof item.content !== 'string') return false;
    return item.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFavorites = favorites.filter(item => {
    if (!item || typeof item.content !== 'string') return false;
    return item.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const formatMessage = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, index) => (
      <p key={index} className="message-line">
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </p>
    ));
  };

  return (
    <div className="app-container">
      {/* Pre-Sidebar (Collapsed Sidebar) */}
      <div className="pre-sidebar">
        <button 
          className="new-chat-btn-pre"
          onClick={newChat}
          title={language === 'Swahili' ? 'Mazungumzo Mapya' : 'New Chat'}
        >
          <FiPlus className="new-chat-icon-pre" />
        </button>
        
        <div className="pre-sidebar-divider"></div>
        
        <button
          className="sidebar-toggle-pre"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </button>
      </div>

      {/* Main Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={Logo} alt="Health AI" className="logo-icon" />
            <span className="logo-text">HealthAI</span>
          </div>
          <button 
            className="new-chat-btn-sidebar"
            onClick={newChat}
          >
            <FiPlus className="new-chat-icon-sidebar" />
            <span>{language === 'Swahili' ? 'Mazungumzo Mapya' : 'New Chat'}</span>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="section-title">
              {language === 'Swahili' ? 'Historia' : 'History'}
            </h3>
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder={language === 'Swahili' ? 'Tafuta historia...' : 'Search history...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search history"
              />
            </div>
            <div className="history-list">
              {filteredHistory.length > 0 ? (
                filteredHistory.slice(0, 10).map(item => (
                  <div
                    key={item.id}
                    className="history-item"
                    onClick={() => handleHistoryClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="history-content">
                      <p className="history-text">{(item.content || '').substring(0, 50)}...</p>
                      <p className="history-timestamp">{item.timestamp}</p>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className={`favorite-btn ${item.isFavorite ? 'favorited' : ''}`}
                      aria-label="Toggle favorite"
                    >
                      <FiStar className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="history-empty">
                  {language === 'Swahili' ? 'Hakuna historia inayopatikana.' : 'No history available.'}
                </p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="section-title">
              {language === 'Swahili' ? 'Vipendwa' : 'Favorites'}
            </h3>
            <div className="favorites-list">
              {filteredFavorites.length > 0 ? (
                filteredFavorites.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="favorite-item"
                    onClick={() => handleHistoryClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="favorite-content">
                      <p className="favorite-text">{(item.content || '').substring(0, 50)}...</p>
                      <p className="favorite-timestamp">{item.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="favorites-empty">
                  {language === 'Swahili' ? 'Hakuna vipendwa.' : 'No favorites yet.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="language-switcher">
            <FiGlobe className="globe-icon" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              <option value="Swahili">Kiswahili</option>
              <option value="English">English</option>
            </select>
          </div>
          <div className="sidebar-actions">
            <button onClick={handleExportHistory} className="sidebar-action-btn">
              <FiDownload className="w-4 h-4" />
              <span>{language === 'Swahili' ? 'Pakua' : 'Export'}</span>
            </button>
            <button onClick={() => setShowClearModal(true)} className="sidebar-action-btn">
              <FiTrash2 className="w-4 h-4" />
              <span>{language === 'Swahili' ? 'Futa' : 'Clear'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Chat Messages */}
        <div className="chat-messages">
          {chatHistory.length === 0 ? (
            <div className="welcome-container">
              <div className="welcome-header">
                <div className="welcome-avatar">
                  <img src={Logo} alt="AI" className="ai-avatar" />
                </div>
                <h1 className="welcome-title">
                  {language === 'Swahili' ? 'Karibu kwenye Msaidizi wa Afya' : 'Welcome to Health Assistant'}
                </h1>
                <p className="welcome-subtitle">
                  {language === 'Swahili' ? 
                    'Ninawezaje kukusaidia leo? Andika dalili zako au chagua moja ya mifano hapa chini.' :
                    'How can I help you today? Describe your symptoms or choose from examples below.'}
                </p>
              </div>

              <div className="quick-prompts-grid">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="prompt-card"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    <div className="prompt-icon">
                      <FiMessageSquare className="prompt-icon-svg" />
                    </div>
                    <span className="prompt-text">
                      {language === 'Swahili' ? prompt.sw : prompt.en}
                    </span>
                  </button>
                ))}
              </div>

              <div className="disclaimer">
                <FiAlertTriangle className="disclaimer-icon" />
                <p className="disclaimer-text">
                  {language === 'Swahili' ? 
                    'Ushauri huu ni kwa madhumuni ya maelezo tu. Tafadhali wasiliana na daktari kwa ushauri wa matibabu.' :
                    'This advice is for informational purposes only. Please consult a doctor for medical advice.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-avatar">
                    {message.type === 'user' ? (
                      <div className="user-avatar-small">
                        <FiUser />
                      </div>
                    ) : (
                      <div className="bot-avatar">
                        <img src={Logo} alt="AI" className="bot-avatar-img" />
                      </div>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-sender">
                        {message.type === 'user' ? 
                          (language === 'Swahili' ? 'Wewe' : 'You') : 
                          (language === 'Swahili' ? 'Msaidizi wa Afya' : 'Health Assistant')}
                      </span>
                      <span className="message-time">{message.timestamp}</span>
                    </div>
                    <div className={`message-bubble ${message.type === 'error' ? 'error' : ''}`}>
                      <div className="message-text">
                        {formatMessage(message.content)}
                      </div>
                      <div className="message-actions">
                        <button 
                          className="action-btn"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          title={language === 'Swahili' ? 'Nakili' : 'Copy'}
                        >
                          {copiedMessageId === message.id ? <FiCheck /> : <FiCopy />}
                        </button>
                        {message.type === 'user' && (
                          <button 
                            className="action-btn"
                            onClick={shareChat}
                            title={language === 'Swahili' ? 'Shiriki' : 'Share'}
                          >
                            <FiShare2 />
                          </button>
                        )}
                        {message.type === 'bot' && (
                          <button 
                            className="action-btn"
                            onClick={regenerateResponse}
                            title={language === 'Swahili' ? 'Tengeneza Upya' : 'Regenerate'}
                          >
                            <FiRotateCcw />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="message bot">
                  <div className="message-avatar">
                    <div className="bot-avatar">
                      <img src={Logo} alt="AI" className="bot-avatar-img" />
                    </div>
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-sender">
                        {language === 'Swahili' ? 'Msaidizi wa Afya' : 'Health Assistant'}
                      </span>
                    </div>
                    <div className="message-bubble">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              placeholder={language === 'Swahili' ? 
                'Andika dalili zako hapa...' : 
                'Describe your symptoms here...'}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              onKeyDown={handleKeyPress}
              className="chat-input"
              rows="1"
              disabled={loading}
            />
            <div className="input-actions">
              {symptoms && (
                <button
                  onClick={() => setSymptoms('')}
                  className="action-btn"
                  aria-label="Clear input"
                  title={language === 'Swahili' ? 'Futa maandishi' : 'Clear input'}
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleAnalyze}
                disabled={loading || !symptoms.trim()}
                className={`send-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <FiSend className="send-icon" />
                )}
              </button>
            </div>
          </div>
          <div className="input-footer">
            <p className="disclaimer-small">
              {language === 'Swahili' ? 
                'Msaidizi wa Afya. Ushauri wa awali tu. Si badala ya daktari.' :
                'Health Assistant. Preliminary advice only. Not a substitute for a doctor.'}
            </p>
          </div>
        </div>
      </div>

      {/* Modals and Overlays */}
      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              {language === 'Swahili' ? 'Thibitisha Futa Historia' : 'Confirm Clear History'}
            </h3>
            <p className="modal-text">
              {language === 'Swahili' ? 
                'Je, una uhakika unataka kufuta historia yote?' : 
                'Are you sure you want to clear all history?'}
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowClearModal(false)} className="modal-btn modal-btn-cancel">
                {language === 'Swahili' ? 'Ghairi' : 'Cancel'}
              </button>
              <button onClick={clearChat} className="modal-btn modal-btn-confirm">
                {language === 'Swahili' ? 'Futa' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {copiedMessageId && (
        <div className="toast-notification">
          {language === 'Swahili' ? 'Imenakiliwa!' : 'Copied to clipboard!'}
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;