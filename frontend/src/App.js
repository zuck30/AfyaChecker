import React, { useState, useEffect, useRef } from 'react';
import {
  FiSend, FiUser, FiGlobe, FiX, FiCopy, FiCheck,
  FiMessageSquare, FiSearch, FiStar, FiShare2, FiRotateCcw,
  FiAlertTriangle, FiPlus, FiChevronRight, FiChevronLeft, FiMic, FiSpeaker, FiUpload, FiFile, FiClock, FiThumbsUp, FiRotateCw,
  FiMenu, FiHeart, FiAlertCircle, FiBook, FiBookmark, FiAward
} from 'react-icons/fi';
import { 
  MdEmergency,
} from 'react-icons/md';
import './App.css';
import Logo from './images/logo.png';

// Basic language detection
const swahiliKeywords = ['homa','maumivu','kichochozi','kikohozi','siku','kufanya','suala','mimba','kutoa','jasiri','sio'];

function detectLanguage(text) {
  if (!text) return 'English';
  const t = text.toLowerCase();
  let scoreSw = 0;
  for (const k of swahiliKeywords) if (t.includes(k)) scoreSw++;
  return scoreSw >= 1 ? 'Swahili' : 'English';
}

function getFollowUpSuggestions(message) {
  return [
    { id: 'duration', textEn: 'How long have the symptoms lasted?', textSw: 'Dalili zimeanza lini?' },
    { id: 'severity', textEn: 'How severe are the symptoms (mild/moderate/severe)?', textSw: 'Je, dalili ni za kiwango gani (nyepesi/kati/mbaya)?' },
    { id: 'meds', textEn: 'Are you taking any medication currently?', textSw: 'Una dawa yoyote unayeyatumia sasa?' },
  ];
}

export default function App() {
  // Core state
  const [symptoms, setSymptoms] = useState('');
  const [language, setLanguage] = useState('Swahili');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [ratingMap, setRatingMap] = useState({});
  const [lastBotId, setLastBotId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeView, setActiveView] = useState('chat');
  const [pinnedChats, setPinnedChats] = useState([]);
  const [medicalProfile, setMedicalProfile] = useState({
    name: '',
    age: '',
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: ''
  });
  
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Quick prompts and templates
  const quickPrompts = [
    { en: 'Fever and cough for 3 days', sw: 'Homa na kikohozi kwa siku 3', category: 'respiratory', priority: 'routine' },
    { en: 'Headache and fatigue', sw: 'Maumivu ya kichwa na uchovu', category: 'neurological', priority: 'routine' },
    { en: 'Sore throat and fever', sw: 'Koo linawasha na homa', category: 'respiratory', priority: 'urgent' },
    { en: 'Stomach pain and nausea', sw: 'Maumivu ya tumbo na kichefuchefu', category: 'digestive', priority: 'routine' },
  ];

  const emergencyProtocols = [
    { name: 'Heart Attack', number: '911', steps: ['Call emergency', 'Chew aspirin', 'Stay calm'] },
    { name: 'Severe Bleeding', number: '911', steps: ['Apply pressure', 'Elevate injury', 'Call emergency'] },
    { name: 'Difficulty Breathing', number: '911', steps: ['Call emergency', 'Stay upright', 'Loosen clothing'] }
  ];

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load data from localStorage
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const savedFavorites = JSON.parse(localStorage.getItem('chatFavorites')) || [];
    const savedRating = JSON.parse(localStorage.getItem('chatRatings')) || {};
    const savedPinned = JSON.parse(localStorage.getItem('pinnedChats')) || [];
    const savedProfile = JSON.parse(localStorage.getItem('medicalProfile')) || {};
    
    setChatHistory(savedHistory);
    setFavorites(savedFavorites);
    setRatingMap(savedRating);
    setPinnedChats(savedPinned);
    setMedicalProfile(savedProfile);
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('chatFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('chatRatings', JSON.stringify(ratingMap));
  }, [ratingMap]);

  useEffect(() => {
    localStorage.setItem('pinnedChats', JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  useEffect(() => {
    localStorage.setItem('medicalProfile', JSON.stringify(medicalProfile));
  }, [medicalProfile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setSymptoms(prev => (prev ? prev + ' ' + text : text));
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  // Helper functions
  const pushMessage = (msg) => {
    setChatHistory(prev => [...prev, msg]);
  };

  const safeTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('copy failed', err);
    }
  };

  const toggleFavorite = (id, e) => {
    e?.stopPropagation();
    const updatedHistory = chatHistory.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item);
    setChatHistory(updatedHistory);
    const updatedFavorites = updatedHistory.filter(i => i.isFavorite);
    setFavorites(updatedFavorites);
  };

  const togglePin = (id, e) => {
    e?.stopPropagation();
    setPinnedChats(prev => 
      prev.includes(id) 
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  const handleQuickPrompt = (promptObj) => {
    const txt = language === 'Swahili' ? promptObj.sw : promptObj.en;
    setSymptoms(txt);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleAnalyze();
    } else if (e.key === 'Escape') {
      setSymptoms('');
    }
  };

  const regenerateResponse = () => {
    const lastUser = [...chatHistory].reverse().find(m => m.type === 'user');
    if (lastUser) {
      setSymptoms(lastUser.content);
      setTimeout(() => handleAnalyze(true, lastUser.content), 50);
    }
  };

  const rateMessage = (id, rating) => {
    setRatingMap(prev => ({ ...prev, [id]: rating }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setAttachedFile(f);
    }
  };

  const shareChat = () => {
    const latestUser = [...chatHistory].reverse().find(m => m.type === 'user');
    const latestBot = [...chatHistory].reverse().find(m => m.type === 'bot');
    const text = `${latestUser?.content || ''}\n\n${latestBot?.content || ''}`;
    if (navigator.share) {
      navigator.share({
        title: 'AfyaChecker Chat',
        text,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedMessageId('share');
      setTimeout(() => setCopiedMessageId(null), 1800);
    }
  };

  const handleAnalyze = async (isRegenerate = false, overrideSymptoms = null) => {
    const textToSend = overrideSymptoms ?? symptoms?.trim();
    if (!textToSend) return;
    setLoading(true);

    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: textToSend,
      timestamp: safeTimestamp(),
      fullTimestamp: new Date().toLocaleString(),
      language,
      isFavorite: false,
      attachments: attachedFile ? { name: attachedFile.name, size: attachedFile.size } : null
    };
    pushMessage(userMsg);
    setSymptoms('');
    setAttachedFile(null);

    const placeholder = {
      id: Date.now() + 1,
      type: 'bot',
      content: language === 'Swahili' ? 'Nafungua uchambuzi...' : 'Analyzing...',
      timestamp: safeTimestamp(),
      fullTimestamp: new Date().toLocaleString(),
      language
    };
    pushMessage(placeholder);

    const apiUrl = process.env.REACT_APP_API_URL || '';
    try {
      if (apiUrl) {
        const resp = await fetch(`${apiUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: textToSend, language })
        });
        if (!resp.ok) throw new Error('API failed');
        const data = await resp.json();
        const analysis = data.analysis || data.error || (language === 'Swahili' ? 'Hakuna uchambuzi kutoka kwa seva.' : 'No analysis from server.');
        setChatHistory(prev => {
          const replaced = prev.map(p => p.id === placeholder.id ? { ...p, content: analysis } : p);
          return replaced;
        });
        setLastBotId(placeholder.id);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('analyze API failed', err);
    }

    const fallback = language === 'Swahili'
      ? `Nimepokea dalili zako: "${textToSend}". Tafadhali taja:\n• Ni lini zilianza\n• Je, zimeongezeka au kupungua\n• Dawa unayochukua\n\nHii ni ushauri wa awali tu. Tafadhali wasiliana na daktari kwa uchunguzi wa kliniki.`
      : `I received your symptoms: "${textToSend}". Please share:\n• When they started\n• How they changed over time\n• Any medication you're taking\n\nThis is preliminary advice only. See a doctor for clinical assessment.`;

    setChatHistory(prev => prev.map(p => p.id === placeholder.id ? { ...p, content: fallback } : p));
    setLastBotId(placeholder.id);
    setLoading(false);
  };

  const suggestionsForLastBot = () => {
    const lastBot = [...chatHistory].reverse().find(m => m.type === 'bot');
    if (!lastBot) return [];
    return getFollowUpSuggestions(lastBot.content);
  };

  const clearChat = () => {
    setChatHistory([]);
    localStorage.removeItem('chatHistory');
    setFavorites([]);
    localStorage.removeItem('chatFavorites');
    setShowClearModal(false);
  };

  const newChat = () => {
    setChatHistory([]);
    setSymptoms('');
    setSidebarOpen(false);
    setAttachedFile(null);
    setActiveView('chat');
  };

  const handleHistoryClick = (item) => {
    if (item.type === 'user') {
      setSymptoms(item.content);
      textareaRef.current?.focus();
    }
    setSidebarOpen(false);
    setActiveView('chat');
  };

  const updateMedicalProfile = (field, value) => {
    setMedicalProfile(prev => ({ ...prev, [field]: value }));
  };

  const filteredHistory = chatHistory.filter(item => (item.content || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFavorites = favorites.filter(item => (item.content || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const pinnedChatItems = chatHistory.filter(item => pinnedChats.includes(item.id));

  // Voice: TTS
  const speakText = (text) => {
    if (!text || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith(language === 'Swahili' ? 'sw' : 'en')) || voices[0];
    if (v) utter.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  // Voice: STT toggle
  const toggleListen = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert(language === 'Swahili' ? 'Sio sampuli ya spishi inapatikana kwa kivinjari chako.' : 'Speech recognition not available in your browser.');
      return;
    }
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      rec.lang = language === 'Swahili' ? 'sw-KE' : 'en-US';
      rec.start();
      setIsListening(true);
    }
  };

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <div className="mobile-bottom-nav">
      <button 
        className="mobile-nav-btn"
        onClick={() => setSidebarOpen(true)}
      >
        <FiMenu className="mobile-nav-icon" />
        <span>{language === 'Swahili' ? 'Menyu' : 'Menu'}</span>
      </button>
      <button 
        className="mobile-nav-btn"
        onClick={newChat}
      >
        <FiPlus className="mobile-nav-icon" />
        <span>{language === 'Swahili' ? 'Mpya' : 'New'}</span>
      </button>
      <button 
        className="mobile-nav-btn"
        onClick={() => { setSidebarOpen(true); setActiveView('favorites'); }}
      >
        <FiStar className="mobile-nav-icon" />
        <span>{language === 'Swahili' ? 'Vipendwa' : 'Favorites'}</span>
      </button>
      <button 
        className="mobile-nav-btn"
        onClick={() => { setSidebarOpen(true); setActiveView('quick-actions'); }}
      >
        <FiAlertCircle className="mobile-nav-icon" />
        <span>{language === 'Swahili' ? 'Haraka' : 'Quick'}</span>
      </button>
    </div>
  );

  // Render different sidebar views
  const renderSidebarContent = () => {
    switch (activeView) {
      case 'favorites':
        return (
          <div className="sidebar-view">
            <div className="view-header">
              <FiStar />
              <h3>{language === 'Swahili' ? 'Vipendwa' : 'Favorites'}</h3>
            </div>
            <div className="favorites-list">
              {filteredFavorites.length ? filteredFavorites.map(f => (
                <div key={f.id} className="favorite-item" onClick={() => handleHistoryClick(f)}>
                  <div className="favorite-content">
                    <p className="favorite-text">{(f.content || '').slice(0, 60)}...</p>
                    <p className="favorite-timestamp">{f.timestamp}</p>
                  </div>
                </div>
              )) : (
                <p className="empty-state">{language === 'Swahili' ? 'Hakuna vipendwa.' : 'No favorites yet.'}</p>
              )}
            </div>
          </div>
        );

      case 'quick-actions':
        return (
          <div className="sidebar-view">
            <div className="view-header">
              <FiAlertCircle />
              <h3>{language === 'Swahili' ? 'Vitendo vya Haraka' : 'Quick Actions'}</h3>
            </div>
            
            <div className="quick-actions-grid">
              <div className="action-card emergency">
                <MdEmergency className="action-icon" />
                <h4>{language === 'Swahili' ? 'Dharura' : 'Emergency'}</h4>
                <p>{language === 'Swahili' ? 'Piga simu ya dharura' : 'Call emergency services'}</p>
                <button className="action-btn" onClick={() => window.open('tel:911')}>
                  911 / 112
                </button>
              </div>

              <div className="action-card symptoms">
                <FiHeart className="action-icon" />
                <h4>{language === 'Swahili' ? 'Angalia Dalili' : 'Symptom Check'}</h4>
                <p>{language === 'Swahili' ? 'Anza uchunguzi wa haraka' : 'Start quick assessment'}</p>
              </div>

              <div className="action-card history">
                <FiBook className="action-icon" />
                <h4>{language === 'Swahili' ? 'Historia ya Afya' : 'Health History'}</h4>
                <p>{language === 'Swahili' ? 'Angalia rekodi zako' : 'View your records'}</p>
              </div>
            </div>

            <div className="emergency-protocols">
              <h4>{language === 'Swahili' ? 'Miongozo ya Dharura' : 'Emergency Protocols'}</h4>
              {emergencyProtocols.map((protocol, index) => (
                <div key={index} className="protocol-item">
                  <strong>{protocol.name}</strong>
                  <span className="protocol-number">{protocol.number}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="sidebar-view">
            <div className="view-header">
              <FiUser />
              <h3>{language === 'Swahili' ? 'Wasifu wa Afya' : 'Health Profile'}</h3>
            </div>
            
            <div className="profile-form">
              <div className="form-group">
                <label>{language === 'Swahili' ? 'Jina' : 'Name'}</label>
                <input
                  type="text"
                  value={medicalProfile.name}
                  onChange={(e) => updateMedicalProfile('name', e.target.value)}
                  placeholder={language === 'Swahili' ? 'Jina kamili' : 'Full name'}
                />
              </div>
              
              <div className="form-group">
                <label>{language === 'Swahili' ? 'Umri' : 'Age'}</label>
                <input
                  type="number"
                  value={medicalProfile.age}
                  onChange={(e) => updateMedicalProfile('age', e.target.value)}
                  placeholder={language === 'Swahili' ? 'Umri wako' : 'Your age'}
                />
              </div>
              
              <div className="form-group">
                <label>{language === 'Swahili' ? 'Aina ya Damu' : 'Blood Type'}</label>
                <select
                  value={medicalProfile.bloodType}
                  onChange={(e) => updateMedicalProfile('bloodType', e.target.value)}
                >
                  <option value="">{language === 'Swahili' ? 'Chagua...' : 'Select...'}</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>{language === 'Swahili' ? 'Mzio' : 'Allergies'}</label>
                <input
                  type="text"
                  value={medicalProfile.allergies}
                  onChange={(e) => updateMedicalProfile('allergies', e.target.value)}
                  placeholder={language === 'Swahili' ? 'Mzio wowote' : 'Any allergies'}
                />
              </div>
              
              <div className="form-group">
                <label>{language === 'Swahili' ? 'Dawa' : 'Medications'}</label>
                <textarea
                  value={medicalProfile.medications}
                  onChange={(e) => updateMedicalProfile('medications', e.target.value)}
                  placeholder={language === 'Swahili' ? 'Dawa unazochukua' : 'Current medications'}
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      default: // chat view
        return (
          <div className="sidebar-view">
            <div className="view-header">
              <FiMessageSquare />
              <h3>{language === 'Swahili' ? 'Mazungumzo' : 'Chats'}</h3>
            </div>

            {/* Pinned Chats */}
            {pinnedChatItems.length > 0 && (
              <div className="section">
                <h4 className="section-title">
                  <FiBookmark />
                  {language === 'Swahili' ? 'Imeunganishwa' : 'Pinned'}
                </h4>
                <div className="pinned-list">
                  {pinnedChatItems.map(item => (
                    <div key={item.id} className="pinned-item" onClick={() => handleHistoryClick(item)}>
                      <div className="item-content">
                        <p className="item-text">{(item.content || '').slice(0, 50)}...</p>
                        <p className="item-timestamp">{item.timestamp}</p>
                      </div>
                      <button className="unpin-btn" onClick={(e) => togglePin(item.id, e)}>
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Access Templates */}
            <div className="section">
              <h4 className="section-title">
                <FiAward />
                {language === 'Swahili' ? 'Viwanja vya Haraka' : 'Quick Templates'}
              </h4>
              <div className="templates-grid">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className="template-card"
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    <span className={`priority-badge ${prompt.priority}`}>{prompt.priority}</span>
                    <span className="template-text">{language === 'Swahili' ? prompt.sw : prompt.en}</span>
                    <span className="category-tag">{prompt.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent History */}
            <div className="section">
              <h4 className="section-title">
                <FiClock />
                {language === 'Swahili' ? 'Historia ya Hivi Karibuni' : 'Recent History'}
              </h4>
              <div className="search-container">
                <FiSearch className="search-icon" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'Swahili' ? 'Tafuta historia...' : 'Search history...'}
                  className="search-input"
                />
              </div>
              <div className="history-list">
                {filteredHistory.length ? filteredHistory.slice(0, 8).map(item => (
                  <div key={item.id} className="history-item" onClick={() => handleHistoryClick(item)}>
                    <div className="item-content">
                      <p className="item-text">{(item.content || '').slice(0, 50)}...</p>
                      <p className="item-timestamp">{item.timestamp}</p>
                    </div>
                    <div className="item-actions">
                      <button className={`favorite-btn ${item.isFavorite ? 'favorited' : ''}`} onClick={(e) => toggleFavorite(item.id, e)}>
                        <FiStar />
                      </button>
                      <button className={`pin-btn ${pinnedChats.includes(item.id) ? 'pinned' : ''}`} onClick={(e) => togglePin(item.id, e)}>
                        <FiBookmark />
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="empty-state">{language === 'Swahili' ? 'Hakuna historia.' : 'No history yet.'}</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Enhanced Pre Sidebar */}
      <div className="pre-sidebar">
        <button className="pre-sidebar-btn" onClick={newChat} title={language === 'Swahili' ? 'Mazungumzo Mapya' : 'New Chat'}>
          <FiMessageSquare />
        </button>
        
        <button 
          className={`pre-sidebar-btn ${activeView === 'chat' ? 'active' : ''}`}
          onClick={() => { setSidebarOpen(true); setActiveView('chat'); }}
          title={language === 'Swahili' ? 'Mazungumzo' : 'Chats'}
        >
          <FiMenu />
        </button>
        
        <button 
          className={`pre-sidebar-btn ${activeView === 'favorites' ? 'active' : ''}`}
          onClick={() => { setSidebarOpen(true); setActiveView('favorites'); }}
          title={language === 'Swahili' ? 'Vipendwa' : 'Favorites'}
        >
          <FiStar />
        </button>
        
        <button 
          className={`pre-sidebar-btn ${activeView === 'quick-actions' ? 'active' : ''}`}
          onClick={() => { setSidebarOpen(true); setActiveView('quick-actions'); }}
          title={language === 'Swahili' ? 'Vitendo vya Haraka' : 'Quick Actions'}
        >
          <FiAlertCircle />
        </button>
        
        <button 
          className={`pre-sidebar-btn ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => { setSidebarOpen(true); setActiveView('profile'); }}
          title={language === 'Swahili' ? 'Wasifu Wangu' : 'My Profile'}
        >
          <FiUser />
        </button>

        <div className="pre-sidebar-divider"></div>
        
        <button className="pre-sidebar-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? 'Close' : 'Open'}>
          {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </button>
      </div>

      {/* Enhanced Sidebar */}
      {!isMobile && (
        <div className={`desktop-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src={Logo} alt="AfyaChecker" className="logo-icon" />
              <span className="logo-text">AfyaChecker</span>
            </div>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <FiX />
            </button>
          </div>

          <div className="sidebar-content">
            {renderSidebarContent()}
          </div>

          <div className="sidebar-footer">
            <div className="language-switcher">
              <FiGlobe className="globe-icon" />
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="Swahili">Kiswahili</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div className={`mobile-sidebar ${sidebarOpen ? 'mobile-sidebar-open' : ''}`}>
          <div className="mobile-sidebar-header">
            <div className="sidebar-logo">
              <img src={Logo} alt="AfyaChecker" className="logo-icon" />
              <span className="logo-text">AfyaChecker</span>
            </div>
            <button 
              className="mobile-sidebar-close"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX />
            </button>
          </div>

          <div className="mobile-sidebar-content">
            {renderSidebarContent()}
          </div>

          <div className="mobile-sidebar-footer">
            <div className="language-switcher-mobile">
              <FiGlobe />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="Swahili">Kiswahili</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`main-content ${isMobile ? 'mobile' : 'desktop'} ${sidebarOpen && !isMobile ? 'sidebar-open' : ''}`}>
        {/* Desktop Header - Transparent */}
        {!isMobile && (
          <div className="top-bar">
            <div className="top-left">
              <img src={Logo} alt="logo" className="top-logo" />
              <div className="app-title-block">
                <div className="app-title">AfyaChecker</div>
                <div className="app-sub">Clinical assistant • quick checks</div>
              </div>
            </div>

            <div className="top-actions">
              <button className="action" onClick={newChat} title="New chat"><FiPlus /></button>
              <button className="action" onClick={shareChat} title="Share"><FiShare2 /></button>
              <button className="action" onClick={regenerateResponse} title="Regenerate"><FiRotateCw /></button>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <section className="chat-messages">
          {chatHistory.length === 0 ? (
            <div className="welcome-container">
              <div className="welcome-header">
                <div className="welcome-avatar">
                  <img src={Logo} alt="ai" />
                </div>
                <h1 className="welcome-title">{language === 'Swahili' ? 'Karibu AfyaChecker' : 'Welcome to AfyaChecker'}</h1>
                <p className="welcome-subtitle">{language === 'Swahili' ? 'Eleza dalili zako au chagua mfano hapa chini.' : 'Describe your symptoms or choose an example below.'}</p>
              </div>

              <div className="quick-prompts-grid">
                {quickPrompts.map((p, i) => (
                  <button key={i} className="prompt-card" onClick={() => handleQuickPrompt(p)}>
                    <FiMessageSquare />
                    <span>{language === 'Swahili' ? p.sw : p.en}</span>
                  </button>
                ))}
              </div>

              <div className="disclaimer">
                <FiAlertTriangle />
                <p>{language === 'Swahili' ? 'Ushauri wa utafiti tu. Tafadhali wasiliana na daktari.' : 'Informational only. Consult a doctor.'}</p>
              </div>
            </div>
          ) : (
            <>
              {chatHistory.map(msg => (
                <article key={msg.id} className={`message ${msg.type}`}>
                  <div className="message-avatar">
                    {msg.type === 'user' ? <div className="user-avatar"><FiUser /></div> : <div className="bot-avatar"><img src={Logo} alt="bot" /></div>}
                  </div>

                  <div className="message-body">
                    <div className="message-header">
                      <div className="message-sender">{msg.type === 'user' ? (language === 'Swahili' ? 'Wewe' : 'You') : (language === 'Swahili' ? 'Msaidizi wa Afya' : 'Health Assistant')}</div>
                      <div className="message-time">{msg.timestamp}</div>
                    </div>

                    <div className={`message-bubble ${msg.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                      <div className="message-text">{msg.content}</div>
                      <div className="message-meta-row">
                        <div className="message-actions">
                          <button className="icon-btn" onClick={() => copyToClipboard(msg.content, msg.id)}>
                            {copiedMessageId === msg.id ? <FiCheck /> : <FiCopy />}
                          </button>

                          {msg.type === 'bot' && (
                            <>
                              <button className="icon-btn" onClick={() => speakText(msg.content)}><FiSpeaker /></button>
                              <button className="icon-btn" onClick={() => { setSymptoms(msg.content); textareaRef.current?.focus(); }}><FiRotateCcw /></button>
                            </>
                          )}
                        </div>

                        <div className="rating-block">
                          <button className={`rate-btn ${ratingMap[msg.id] === 1 ? 'rated' : ''}`} onClick={() => rateMessage(msg.id, 1)}><FiThumbsUp /></button>
                        </div>
                      </div>
                    </div>

                    {/* suggestions for bot responses */}
                    {msg.type === 'bot' && lastBotId === msg.id && (
                      <div className="suggestions-row">
                        {suggestionsForLastBot().map(s => (
                          <button key={s.id} className="suggestion-pill" onClick={() => { setSymptoms(language === 'Swahili' ? s.textSw : s.textEn); textareaRef.current?.focus(); }}>
                            {language === 'Swahili' ? s.textSw : s.textEn}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {loading && (
                <div className="message bot">
                  <div className="message-avatar">
                    <div className="bot-avatar"><img src={Logo} alt="ai" /></div>
                  </div>
                  <div className="message-body">
                    <div className="message-header">
                      <div className="message-sender">{language === 'Swahili' ? 'Msaidizi wa Afya' : 'Health Assistant'}</div>
                    </div>
                    <div className="message-bubble bot-bubble">
                      <div className="typing-indicator"><span/><span/><span/></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </section>

        {/* Input Area - Compact */}
        <footer className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input"
              rows={1}
              placeholder={language === 'Swahili' ? 'Andika dalili zako hapa...' : 'Describe your symptoms here...'}
              value={symptoms}
              onChange={(e) => {
                setSymptoms(e.target.value);
                setLanguage(detectLanguage(e.target.value));
              }}
              onKeyDown={handleKeyPress}
              disabled={loading}
            />

            <div className="input-side">
              <div className="file-upload">
                <label className="file-label">
                  <input type="file" onChange={handleFileChange} />
                  <FiUpload />
                </label>
                {attachedFile && <div className="attached-info"><FiFile /> {attachedFile.name}</div>}
              </div>

              <div className="input-actions">
                <button className={`icon-btn mic ${isListening ? 'listening' : ''}`} onClick={toggleListen}>
                  <FiMic />
                </button>

                {symptoms && (
                  <button className="icon-btn clear" onClick={() => setSymptoms('')}><FiX /></button>
                )}

                <button className={`send-btn ${loading || !symptoms.trim() ? 'disabled' : ''}`} onClick={() => handleAnalyze()} disabled={loading || !symptoms.trim()}>
                  {loading ? <div className="loading-spinner"></div> : <FiSend />}
                </button>
              </div>
            </div>
          </div>

          <div className="input-footer">
            <div className="disclaimer-small">
              <FiAlertTriangle />
              {language === 'Swahili' ? 'Ushauri wa awali tu. Si badala ya daktari.' : 'Preliminary advice only. Not a substitute for a doctor.'}
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileNav />}

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Clear History Modal */}
      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <FiAlertTriangle className="modal-icon" />
              <h3 className="modal-title">
                {language === 'Swahili' ? 'Futa Historia' : 'Clear History'}
              </h3>
            </div>
            <p className="modal-text">
              {language === 'Swahili' ? 
                'Je, una uhakika unataka kufuta historia yote?' : 
                'Are you sure you want to clear all history?'}
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowClearModal(false)} className="modal-btn cancel">
                {language === 'Swahili' ? 'Ghairi' : 'Cancel'}
              </button>
              <button onClick={clearChat} className="modal-btn confirm">
                {language === 'Swahili' ? 'Futa' : 'Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {copiedMessageId && (
        <div className="toast-notification">
          <FiCheck className="toast-icon" />
          {language === 'Swahili' ? 'Imenakiliwa!' : 'Copied!'}
        </div>
      )}
    </div>
  );
}