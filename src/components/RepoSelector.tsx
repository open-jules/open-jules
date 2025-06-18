import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Github, RefreshCw } from 'lucide-react';

interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  description: string;
  private: boolean;
}

interface Branch {
  name: string;
  sha: string;
  protected: boolean;
}

interface RepoSelectorProps {
  token: string;
  selectedRepo: string;
  selectedBranch: string;
  onRepoSelect: (repo: string) => void;
  onBranchSelect: (branch: string) => void;
}

export function RepoSelector({ 
  token, 
  selectedRepo, 
  selectedBranch, 
  onRepoSelect, 
  onBranchSelect 
}: RepoSelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const fetchRepositories = useCallback(async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch('http://localhost:3001/api/repos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (response.ok) {
        const repos = await response.json();
        setRepositories(repos);
      } else {
        console.error('Failed to fetch repositories');
        setRepositories([]);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setRepositories([]);
    } finally {
      setLoadingRepos(false);
    }
  }, [token]);

  const fetchBranches = useCallback(async () => {
    if (!selectedRepo) return;

    setLoadingBranches(true);
    try {
      const [owner, repo] = selectedRepo.split('/');
      const response = await fetch('http://localhost:3001/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, owner, repo })
      });

      if (response.ok) {
        const branchData = await response.json();
        setBranches(branchData);
        
        // Auto-select main/master branch if available
        const defaultBranch = branchData.find((b: Branch) => 
          ['main', 'master'].includes(b.name)
        );
        if (defaultBranch && !selectedBranch) {
          onBranchSelect(defaultBranch.name);
        }
      } else {
        console.error('Failed to fetch branches');
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  }, [token, selectedRepo, selectedBranch, onBranchSelect]);

  useEffect(() => {
    if (token) {
      fetchRepositories();
    } else {
      setRepositories([]);
      setBranches([]);
      onRepoSelect('');
      onBranchSelect('');
    }
  }, [token, fetchRepositories, onRepoSelect, onBranchSelect]);

  useEffect(() => {
    if (selectedRepo && token) {
      fetchBranches();
    } else {
      setBranches([]);
      onBranchSelect('');
    }
  }, [selectedRepo, token, fetchBranches, onBranchSelect]);

  return (
    <div className="space-y-4">
      {/* Repository Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="repo-select" className="block text-sm font-medium text-blue-100">
            Repository
          </label>
          {token && (
            <button
              onClick={fetchRepositories}
              disabled={loadingRepos}
              className="flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200"
            >
              <RefreshCw className={`w-3 h-3 ${loadingRepos ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
        
        <select
          id="repo-select"
          value={selectedRepo}
          onChange={(e) => onRepoSelect(e.target.value)}
          disabled={!token || loadingRepos}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">
            {!token ? 'Enter GitHub token first' : 
             loadingRepos ? 'Loading repositories...' : 
             'Select a repository'}
          </option>
          {repositories.map((repo) => (
            <option key={repo.id} value={repo.full_name}>
              {repo.full_name} {repo.private ? '(Private)' : '(Public)'}
            </option>
          ))}
        </select>
        
        {selectedRepo && (
          <div className="mt-2 p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <Github className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300">
                {repositories.find(repo => repo.full_name === selectedRepo)?.description || 'No description'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Branch Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="branch-select" className="block text-sm font-medium text-blue-100">
            Base Branch
          </label>
          {selectedRepo && (
            <button
              onClick={fetchBranches}
              disabled={loadingBranches}
              className="flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200"
            >
              <RefreshCw className={`w-3 h-3 ${loadingBranches ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
        
        <select
          id="branch-select"
          value={selectedBranch}
          onChange={(e) => onBranchSelect(e.target.value)}
          disabled={!selectedRepo || loadingBranches}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">
            {!selectedRepo ? 'Select repository first' : 
             loadingBranches ? 'Loading branches...' : 
             'Select base branch'}
          </option>
          {branches.map((branch) => (
            <option key={branch.name} value={branch.name}>
              {branch.name} {branch.protected ? '(Protected)' : ''}
            </option>
          ))}
        </select>
        
        {selectedBranch && (
          <div className="mt-2 p-3 bg-slate-800/30 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <GitBranch className="w-4 h-4 text-green-400" />
              <span className="text-green-300">
                Will create new branch from: <code className="bg-slate-800 px-1 rounded">{selectedBranch}</code>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}