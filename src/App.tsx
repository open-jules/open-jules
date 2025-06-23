import React, { useState, useEffect } from 'react';
import { Settings, Github } from 'lucide-react';
import { TaskQueue } from './components/TaskQueue';
import { SettingsModal } from './components/SettingsModal';

interface AgentModels {
  planner: string;
  branchNamer: string;
  embedder: string;
  developer: string;
  reviewer: string;
  prWriter: string;
  generator: string;
}

function App() {
  const [githubToken, setGithubToken] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [agentModels, setAgentModels] = useState<AgentModels>({
    planner: '',
    branchNamer: '',
    embedder: '',
    developer: '',
    reviewer: '',
    prWriter: '',
    generator: 'llama3'
  });

  // Load saved settings on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('github-token');
    const savedModels = localStorage.getItem('agent-models');
    
    if (savedToken) setGithubToken(savedToken);
    if (savedModels) {
      try {
        setAgentModels(JSON.parse(savedModels));
      } catch (_e) {
        console.error('Error parsing saved models:', _e);
      }
    }
  }, []);

  const handleTokenSave = (token: string) => {
    setGithubToken(token);
    localStorage.setItem('github-token', token);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-indigo-900 to-purple-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl">
              <img src="/open-jules-logo.png" alt="Open Jules Logo" className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Open Jules</h1>
              <p className="text-blue-200">Multi-agent automation powered by Ollama</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {!githubToken ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <Github className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-4">Welcome to Open Jules</h2>
              <p className="text-slate-300 mb-6">
                To get started, please configure your GitHub token and agent models in the settings.
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
              >
                Open Settings
              </button>
            </div>
          ) : (
            <TaskQueue 
              githubToken={githubToken}
              agentModels={agentModels}
            />
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            githubToken={githubToken}
            agentModels={agentModels}
            onTokenSave={handleTokenSave}
            onModelsSave={setAgentModels}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
