import React, { useState } from 'react';
import { Play, Pause, X, Trash2, Eye, Clock, CheckCircle, XCircle, AlertCircle, PauseCircle, ExternalLink } from 'lucide-react';
import { TaskConsoleModal } from './TaskConsoleModal';

interface Task {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  user: string;
  repo: string;
  branch: string;
  task: string;
  agentModels: Record<string, string>;
  logs: Array<{
    timestamp: string;
    status: 'info' | 'success' | 'error' | 'warning';
    message: string;
    data?: unknown;
  }>;
  progress: number;
  error: string | null;
  result: unknown | null;
}

interface TaskItemProps {
  task: Task;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRemove: () => void;
  getStatusIcon: (status: Task['status']) => React.ReactNode;
  getStatusText: (status: Task['status']) => string;
}

export function TaskItem({ 
  task, 
  onPause, 
  onResume, 
  onCancel, 
  onRemove, 
  getStatusIcon, 
  getStatusText 
}: TaskItemProps) {
  const [showConsole, setShowConsole] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'running':
        return 'text-blue-500';
      case 'paused':
        return 'text-orange-500';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getProgressColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-orange-500';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <>
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {getStatusIcon(task.status)}
            <div>
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
                {task.status === 'running' && (
                  <div className="animate-pulse text-blue-400">●</div>
                )}
              </div>
              <div className="text-sm text-slate-400">
                Created: {formatDate(task.createdAt)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConsole(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="View Console"
            >
              <Eye className="w-4 h-4" />
            </button>
            
            {task.status === 'pending' && (
              <button
                onClick={onCancel}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                title="Cancel Task"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {task.status === 'running' && (
              <button
                onClick={onPause}
                className="p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-900/20 rounded-lg transition-colors"
                title="Pause Task"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            
            {task.status === 'paused' && (
              <button
                onClick={onResume}
                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors"
                title="Resume Task"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            
            {['completed', 'failed', 'cancelled'].includes(task.status) && (
              <button
                onClick={onRemove}
                className="p-2 text-slate-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                title="Remove Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(task.status)}`}
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Task Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Repository:</span>
            <span className="text-white font-mono">{task.repo}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Branch:</span>
            <span className="text-white font-mono">{task.branch}</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-slate-400">Task:</span>
            <span className="text-white flex-1">{task.task}</span>
          </div>
          
          {/* Result Link */}
          {task.status === 'completed' && task.result && typeof task.result === 'object' && 'prUrl' in task.result && (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Result:</span>
              <a
                href={task.result.prUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span>View Pull Request</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          
          {/* Error Message */}
          {task.error && (
            <div className="flex items-start space-x-2">
              <span className="text-slate-400">Error:</span>
              <span className="text-red-400 flex-1">{task.error}</span>
            </div>
          )}
        </div>

        {/* Timing Information */}
        <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Started: {task.startedAt ? formatDate(task.startedAt) : 'Not started'}</span>
            <span>Completed: {task.completedAt ? formatDate(task.completedAt) : 'Not completed'}</span>
          </div>
        </div>
      </div>

      {/* Console Modal */}
      {showConsole && (
        <TaskConsoleModal
          taskId={task.id}
          taskName={task.task}
          onClose={() => setShowConsole(false)}
        />
      )}
    </>
  );
} 