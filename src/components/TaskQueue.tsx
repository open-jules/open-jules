import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Plus, Eye, Clock, CheckCircle, XCircle, AlertCircle, PauseCircle } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { AddTaskModal } from './AddTaskModal';

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

interface QueueStatus {
  queue: Task[];
  running: boolean;
  currentTask: Task | null;
  stats: {
    total: number;
    pending: number;
    running: number;
    paused: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
}

interface TaskQueueProps {
  githubToken: string;
  agentModels: Record<string, string>;
}

export function TaskQueue({ githubToken, agentModels }: TaskQueueProps) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tasks');
      if (response.ok) {
        const status = await response.json();
        setQueueStatus(status);
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStartQueue = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:3001/api/queue/start', { method: 'POST' });
      await fetchQueueStatus();
    } catch (error) {
      console.error('Error starting queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseQueue = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:3001/api/queue/pause', { method: 'POST' });
      await fetchQueueStatus();
    } catch (error) {
      console.error('Error pausing queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCompleted = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:3001/api/queue/clear', { method: 'POST' });
      await fetchQueueStatus();
    } catch (error) {
      console.error('Error clearing completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}`, { method: 'DELETE' });
      await fetchQueueStatus();
    } catch (error) {
      console.error('Error removing task:', error);
    }
  };

  const handlePauseTask = async (taskId: string) => {
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/pause`, { method: 'PUT' });
      await fetchQueueStatus();
    } catch (error) {
      console.error('Error pausing task:', error);
    }
  };

  const handleResumeTask = async (taskId: string) => {
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/resume`, { method: 'PUT' });
      await fetchQueueStatus();
    } catch (error) {
      console.error('Error resuming task:', error);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/cancel`, { method: 'PUT' });
      await fetchQueueStatus();
    } catch (error) {
      console.error('Error cancelling task:', error);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  if (!queueStatus) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Task Queue</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{queueStatus.stats.total}</div>
          <div className="text-sm text-slate-300">Total Tasks</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-500">{queueStatus.stats.pending + queueStatus.stats.running}</div>
          <div className="text-sm text-slate-300">Active</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-500">{queueStatus.stats.completed}</div>
          <div className="text-sm text-slate-300">Completed</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-500">{queueStatus.stats.failed}</div>
          <div className="text-sm text-slate-300">Failed</div>
        </div>
      </div>

      {/* Queue Controls */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={handleStartQueue}
          disabled={loading || queueStatus.running || queueStatus.stats.pending === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded-lg text-white transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Start Queue</span>
        </button>
        <button
          onClick={handlePauseQueue}
          disabled={loading || !queueStatus.running}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 rounded-lg text-white transition-colors"
        >
          <Pause className="w-4 h-4" />
          <span>Pause Queue</span>
        </button>
        <button
          onClick={handleClearCompleted}
          disabled={loading || (queueStatus.stats.completed + queueStatus.stats.failed + queueStatus.stats.cancelled) === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 rounded-lg text-white transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Completed</span>
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {queueStatus.queue.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tasks in queue</p>
            <p className="text-sm">Add a task to get started</p>
          </div>
        ) : (
          queueStatus.queue.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onPause={() => handlePauseTask(task.id)}
              onResume={() => handleResumeTask(task.id)}
              onCancel={() => handleCancelTask(task.id)}
              onRemove={() => handleRemoveTask(task.id)}
              getStatusIcon={getStatusIcon}
              getStatusText={getStatusText}
            />
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          githubToken={githubToken}
          agentModels={agentModels}
          onClose={() => setShowAddModal(false)}
          onTaskAdded={() => {
            setShowAddModal(false);
            fetchQueueStatus();
          }}
        />
      )}
    </div>
  );
} 