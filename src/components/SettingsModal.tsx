import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Save, Bot } from 'lucide-react';
import { useTheme } from '../hooks/use-theme';

interface AgentModels {
  planner: string;
  branchNamer: string;
  embedder: string;
  developer: string;
  reviewer: string;
  prWriter: string;
  generator:string;
}

interface OllamaModel {
  name: string;
  size: number;
  // Add other properties if known, e.g., modified_at: string, digest: string
}

interface SettingsModalProps {
  githubToken: string;
  agentModels: AgentModels;
  onTokenSave: (token: string) => void;
  onModelsSave: (models: AgentModels) => void;
  onClose: () => void;
}

export function SettingsModal({ 
  githubToken,
  agentModels, 
  onTokenSave,
  onModelsSave,
  onClose 
}: SettingsModalProps) {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [localModels, setLocalModels] = useState<AgentModels>(agentModels);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setLocalModels(agentModels);
  }, [agentModels]);

  const agentInfo: { [key: string]: { name: string; description: string; icon: string } } = {
    planner: {
      name: 'Planner Agent',
      description: 'Decomposes tasks into clear implementation steps',
      icon: '🧠'
    },
    branchNamer: {
      name: 'Branch Naming Agent',
      description: 'Generates concise, descriptive Git branch names',
      icon: '🌿'
    },
    embedder: {
      name: 'Embedder Agent',
      description: 'Analyzes codebase structure and context',
      icon: '🔍'
    },
    developer: {
      name: 'Developer Agent',
      description: 'Implements code changes based on plans',
      icon: '👨‍💻'
    },
    reviewer: {
      name: 'Reviewer Agent',
      description: 'Reviews code quality and suggests improvements',
      icon: '🔍'
    },
    prWriter: {
      name: 'PR Writer Agent',
      description: 'Creates professional pull request descriptions',
      icon: '📝'
    },
    generator: {
      name: 'Generator Agent',
      description: 'Model used for general text generation (e.g. analysis, summaries)',
      icon: '✍️'
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      } else {
        console.error('Failed to fetch models');
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onModelsSave(localModels);
    localStorage.setItem('agent-models', JSON.stringify(localModels));
    onClose();
  };

  const handleModelChange = (agent: string, model: string) => {
    setLocalModels(prev => ({
      ...prev,
      [agent]: model
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <p className="text-slate-400">Configure your application settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchModels}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!Object.values(localModels).every(Boolean)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white transition-colors disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-8rem)]">
          {/* GitHub Token Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🔑</span>
              <div>
                <h3 className="font-semibold text-white">GitHub Configuration</h3>
                <p className="text-sm text-slate-400">Set up your GitHub Personal Access Token</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <label className="block text-sm font-medium text-blue-100 mb-2">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => onTokenSave(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-200 mt-1">
                Requires 'repo' scope for full functionality
              </p>
            </div>
          </div>

          {/* Agent Models Section */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-white">Agent Configuration</h3>
                <p className="text-sm text-slate-400">Configure Ollama models for each AI agent</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"></div>
                <span className="ml-3 text-slate-400">Loading models from Ollama...</span>
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <Bot className="w-12 h-12 mx-auto mb-2" />
                  <p>No models found</p>
                  <p className="text-sm">Make sure Ollama is running on localhost:11434</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(agentInfo).map(([key, info]) => (
                  <div key={key} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h3 className="font-semibold text-white">{info.name}</h3>
                        <p className="text-sm text-slate-400">{info.description}</p>
                      </div>
                    </div>
                    
                    <select
                      value={localModels[key as keyof AgentModels] || ''}
                      onChange={(e) => handleModelChange(key, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a model...</option>
                      {models.map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.name} ({(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                {/* Theme Settings */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">🎨</span>
                    <div>
                      <h3 className="font-semibold text-white">Theme</h3>
                      <p className="text-sm text-slate-400">Select your preferred theme</p>
                    </div>
                  </div>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="text-sm text-slate-400">
            {Object.values(localModels).filter(Boolean).length} / {Object.keys(agentInfo).length} agents configured
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}