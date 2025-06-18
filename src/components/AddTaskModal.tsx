import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { RepoSelector } from './RepoSelector';

interface AddTaskModalProps {
  githubToken: string;
  agentModels: Record<string, string>;
  onClose: () => void;
  onTaskAdded: () => void;
}

export function AddTaskModal({ githubToken, agentModels, onClose, onTaskAdded }: AddTaskModalProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [taskPrompt, setTaskPrompt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRepo || !selectedBranch || !taskPrompt) {
      setError('Please fill in all required fields');
      return;
    }

    if (!Object.values(agentModels).every(model => model)) {
      setError('Please configure all agent models in Settings');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: githubToken,
          repo: selectedRepo,
          baseBranch: selectedBranch,
          task: taskPrompt,
          agentModels
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add task');
      }

      const newTask = await response.json();
      console.log('Task added:', newTask);
      onTaskAdded();
    } catch (error) {
      console.error('Error adding task:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add New Task</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Repository Selector */}
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Repository & Branch
            </label>
            <RepoSelector
              token={githubToken}
              selectedRepo={selectedRepo}
              selectedBranch={selectedBranch}
              onRepoSelect={setSelectedRepo}
              onBranchSelect={setSelectedBranch}
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Task Description
            </label>
            <textarea
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Describe the coding task you want to automate..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Agent Models Info */}
          <div className="bg-slate-800/30 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-100 mb-3">Agent Models</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(agentModels).map(([agent, model]) => (
                <div key={agent} className="flex items-center justify-between">
                  <span className="text-slate-400 capitalize">{agent.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-white font-mono">{model || 'Not set'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRepo || !selectedBranch || !taskPrompt}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white font-medium transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Queue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 