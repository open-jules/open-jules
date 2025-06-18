import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Copy } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  status: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: unknown;
}

interface TaskConsoleModalProps {
  taskId: string;
  taskName: string;
  onClose: () => void;
}

export function TaskConsoleModal({ taskId, taskName, onClose }: TaskConsoleModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    const eventSource = new EventSource(`http://localhost:3001/api/tasks/${taskId}/logs`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'task-status') {
          setTaskStatus(data.task);
        } else if (data.type === 'logs') {
          if (Array.isArray(data.logs)) {
            setLogs(prev => [...prev, ...data.logs]);
          }
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [taskId]);

  const getStatusColor = (status: LogEntry['status']) => {
    switch (status) {
      case 'info':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-white';
    }
  };

  const getStatusIcon = (status: LogEntry['status']) => {
    switch (status) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '•';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.status.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-${taskId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = async () => {
    const logText = logs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.status.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy logs:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Task Console</h2>
            <p className="text-slate-400 text-sm">{taskName}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            
            <button
              onClick={copyLogs}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Copy Logs"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={exportLogs}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Export Logs"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Status */}
        {taskStatus && (
          <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-slate-400">Status:</span>
                <span className={`font-medium ${
                  taskStatus.status === 'completed' ? 'text-green-400' :
                  taskStatus.status === 'failed' ? 'text-red-400' :
                  taskStatus.status === 'running' ? 'text-blue-400' :
                  taskStatus.status === 'paused' ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  {taskStatus.status.charAt(0).toUpperCase() + taskStatus.status.slice(1)}
                </span>
                
                <span className="text-slate-400">Progress:</span>
                <span className="text-white">{taskStatus.progress}%</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-slate-400">Started:</span>
                <span className="text-white">
                  {taskStatus.startedAt ? new Date(taskStatus.startedAt).toLocaleString() : 'Not started'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p>No logs available</p>
                <p className="text-xs mt-2">Logs will appear here as the task executes</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <span className="text-slate-500 text-xs min-w-[60px]">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span className="text-lg">{getStatusIcon(log.status)}</span>
                    <span className={`flex-1 ${getStatusColor(log.status)}`}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{logs.length} log entries</span>
            <span>Task ID: {taskId}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 