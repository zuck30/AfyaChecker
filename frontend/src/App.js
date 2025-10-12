import React, { useState, useEffect, useRef } from 'react';
import { FiGlobe, FiSend, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import './App.css';
import Logo from './images/purple.png';

function App() {
  const [symptoms, setSymptoms] = useState('');
  const [language, setLanguage] = useState('Swahili');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  const recommendationPrompts = [
    { en: 'Fever and cough', sw: 'Homa na kikohozi' },
    { en: 'Headache and fatigue', sw: 'Maumivu ya kichwa na uchovu' },
    { en: 'Sore throat and fever', sw: 'Koo linawasha na homa' },
    { en: 'Stomach pain and nausea', sw: 'Maumivu ya tumbo na kichefuchefu' },
  ];

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError(language === 'Swahili' ? 'Tafadhali weka dalili.' : 'Please enter symptoms.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms, language }),
      });
      const data = await response.json();
      setAnalysis(data.analysis || data.error || (language === 'Swahili' ? 'Hakuna uchambuzi unaopatikana.' : 'No analysis available.'));
    } catch (error) {
      setAnalysis(language === 'Swahili' ? 'Hitilafu imetokea. Tafadhali jaribu tena.' : 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  const handlePromptClick = (prompt) => {
    setSymptoms(language === 'Swahili' ? prompt.sw : prompt.en);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  useEffect(() => {
    if (error && symptoms.trim()) {
      setError('');
    }
  }, [symptoms, error]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [analysis, error]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <img
            src={Logo}
            alt="App Logo"
            className="header-logo"
          />
          <div className="header-text">
            <h1 className="header-title">{language === 'Swahili' ? 'Msaidizi wa Afya' : 'Health Assistant'}</h1>
            <p className="header-subtitle">{language === 'Swahili' ? 'Ushauri wa Dalili za Afya' : 'Your Health Guide'}</p>
          </div>
        </div>
      </header>
      <main className="chat-container">
        <div className="chat-messages">
          <div className="welcome-message">
            <div className="bot-message">
              <div className="message-bubble">
                <FiCheckCircle className="message-icon" />
                <p>{language === 'Swahili' ? 'Karibu! Andika dalili zako au chagua moja hapa chini.' : 'Welcome! Type your symptoms or select one below.'}</p>
              </div>
            </div>
            <div className="prompts-container">
              {recommendationPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="prompt-button"
                  onClick={() => handlePromptClick(prompt)}
                  aria-label={language === 'Swahili' ? prompt.sw : prompt.en}
                >
                  {language === 'Swahili' ? prompt.sw : prompt.en}
                </button>
              ))}
            </div>
          </div>
          {analysis && (
            <>
              <div className="user-message">
                <div className="message-bubble user-bubble">
                  <p>{symptoms}</p>
                </div>
              </div>
              <div className="bot-message">
                <div className="message-bubble">
                  <FiCheckCircle className="message-icon" />
                  <h3 className="result-title">{language === 'Swahili' ? 'Matokeo' : 'Results'}</h3>
                  <p className="result-text">{analysis}</p>
                </div>
              </div>
            </>
          )}
          {error && (
            <div className="bot-message">
              <div className="message-bubble error-bubble">
                <FiAlertTriangle className="message-icon error-icon" />
                <p className="error-text">{error}</p>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-area">
          <button
            onClick={() => setLanguage(lang => lang === 'Swahili' ? 'English' : 'Swahili')}
            className="language-toggle-btn"
            aria-label={`Switch to ${language === 'Swahili' ? 'English' : 'Swahili'}`}
            title={language === 'Swahili' ? 'Badili kwa Kiingereza' : 'Switch to Swahili'}
          >
            <FiGlobe className="language-icon" />
            <span className="language-label">{language === 'Swahili' ? 'EN' : 'SW'}</span>
          </button>
          <div className="input-wrapper">
            <textarea
              placeholder={language === 'Swahili' ? 'Andika dalili zako...' : 'Type your symptoms...'}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              onKeyPress={handleKeyPress}
              className="chat-input"
              aria-label="Symptom input"
              rows="1"
              disabled={loading}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !symptoms.trim()}
              className={`send-button ${loading ? 'loading' : ''}`}
              aria-label={loading ? 'Analyzing' : 'Send symptoms'}
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <FiSend className="send-icon" />
              )}
            </button>
          </div>
        </div>
      </main>
     
    </div>
  );
}

export default App;