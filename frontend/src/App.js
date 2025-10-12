import React, { useState } from 'react';
import './App.css';

function App() {
    const [symptoms, setSymptoms] = useState('');
    const [language, setLanguage] = useState('Swahili');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
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
            setAnalysis(data.analysis || data.error || 'No analysis available.');
        } catch (error) {
            setAnalysis('An error occurred. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Swahili Health Symptom Checker</h1>
            </header>
            <main>
                <div className="language-toggle">
                    <button onClick={() => setLanguage(lang => lang === 'Swahili' ? 'English' : 'Swahili')}>
                        Switch to {language === 'Swahili' ? 'English' : 'Swahili'}
                    </button>
                </div>
                <div className="symptom-input">
                    <textarea
                        placeholder={language === 'Swahili' ? 'Weka dalili zako hapa' : 'Enter your symptoms here'}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                    />
                    <button onClick={handleAnalyze} disabled={loading}>
                        {loading ? (language === 'Swahili' ? 'Inachambua...' : 'Analyzing...') : (language === 'Swahili' ? 'Kagua Dalili' : 'Analyze Symptoms')}
                    </button>
                </div>
                {analysis && (
                    <div className="analysis-result">
                        <h2>{language === 'Swahili' ? 'Matokeo' : 'Results'}</h2>
                        <p>{analysis}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
