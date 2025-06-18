import React, { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';

interface StatusEntry {
  timestamp: string;
  status: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: unknown; // Consistent with App.tsx
}

interface ChangeDetail {
  operation: string;
  filePath: string;
}

interface StatusConsoleProps {
  status: StatusEntry[];
}

export function StatusConsole({ status }: StatusConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [status]);

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'success':
        return 'text-green-300';
      case 'error':
        return 'text-red-300';
      case 'warning':
        return 'text-orange-300';
      default:
        return 'text-blue-300';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
        Status Console
      </h2>

      <div
        ref={consoleRef}
        className="bg-slate-900/50 rounded-lg p-4 h-[500px] overflow-y-auto border border-slate-700 font-mono text-sm"
      >
        {status.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Ready to process tasks...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {status.map((entry, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="text-slate-500 text-xs mt-1 flex-shrink-0">
                  {entry.timestamp}
                </span>
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(entry.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${getStatusColor(entry.status)} break-words`}>
                    {entry.message}
                  </p>
                  {entry.data && (
                    <div className="mt-2 text-slate-300">
                      {entry.data.plan && (
                        <div className="bg-slate-800/50 rounded p-2 text-xs">
                          <strong>Plan:</strong>
                          <pre className="whitespace-pre-wrap mt-1">{entry.data.plan}</pre>
                        </div>
                      )}
                      {entry.data.branchName && (
                        <div className="text-xs">
                          <strong>Branch:</strong> <code className="bg-slate-800 px-1 rounded">{entry.data.branchName}</code>
                        </div>
                      )}
                      {entry.data.changes && (
                        <div className="bg-slate-800/50 rounded p-2 text-xs">
                          <strong>Files Modified:</strong>
                          <ul className="mt-1 space-y-1">
                            {(entry.data as { changes?: ChangeDetail[] })?.changes?.map((change: ChangeDetail, i: number) => (
                              <li key={i} className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  change.operation === 'create' ? 'bg-green-600' : 'bg-blue-600'
                                }`}>
                                  {change.operation.toUpperCase()}
                                </span>
                                <code>{change.filePath}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {entry.data.reviewResult && (
                        <div className="bg-slate-800/50 rounded p-2 text-xs">
                          <strong>Review Status:</strong> {entry.data.reviewResult.status}
                          {entry.data.reviewResult.summary && (
                            <p className="mt-1">{entry.data.reviewResult.summary}</p>
                          )}
                        </div>
                      )}
                      {entry.data.prUrl && (
                        <div className="flex items-center space-x-2 mt-2">
                          <a
                            href={entry.data.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Pull Request #{entry.data.prNumber}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
