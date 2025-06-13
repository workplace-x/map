import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Activity, Pause, Play, Trash2 } from 'lucide-react';

interface LogEntry {
  id: string;
  type: string;
  level: string;
  message: string;
  timestamp: string;
  data?: any;
}

const SyncLiveFeed: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const SYNC_SERVICE_URL = process.env.NODE_ENV === 'production' 
    ? '/sync'  // Use nginx proxy in production
    : 'http://localhost:3005'; // Direct connection in development

  const connectToLiveFeed = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(`${SYNC_SERVICE_URL}/live-feed`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        addLog({
          type: 'system',
          level: 'info',
          message: '🔗 Connected to live feed',
          timestamp: new Date().toISOString()
        });
      };

      eventSource.onmessage = (event) => {
        if (!isPaused) {
          try {
            const logData = JSON.parse(event.data);
            
            // Ensure required properties with defaults
            const sanitizedLogData = {
              type: logData.type || 'log',
              level: logData.level || 'info',
              message: logData.message || 'Unknown message',
              timestamp: logData.timestamp || new Date().toISOString(),
              data: logData.data || {}
            };
            
            addLog(sanitizedLogData);
          } catch (error) {
            console.error('Error parsing log data:', error);
            // Add a fallback log entry for parsing errors
            addLog({
              type: 'system',
              level: 'error',
              message: `Failed to parse log data: ${event.data}`,
              timestamp: new Date().toISOString()
            });
          }
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        addLog({
          type: 'system',
          level: 'error',
          message: '❌ Connection lost to live feed',
          timestamp: new Date().toISOString()
        });
      };

    } catch (error) {
      console.error('Error connecting to live feed:', error);
      setIsConnected(false);
    }
  };

  const addLog = (logData: Omit<LogEntry, 'id'>) => {
    const logEntry: LogEntry = {
      ...logData,
      id: `${Date.now()}-${Math.random()}`
    };

    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      // Keep only the last 1000 logs to prevent memory issues
      return newLogs.slice(-1000);
    });

    // Auto-scroll to bottom if enabled
    if (autoScroll && scrollAreaRef.current) {
      setTimeout(() => {
        const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }, 100);
    }
  };

  useEffect(() => {
    connectToLiveFeed();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isPaused]);

  const clearLogs = () => {
    setLogs([]);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const reconnect = () => {
    connectToLiveFeed();
  };

  const getLevelColor = (level: string) => {
    if (!level) return 'text-gray-600 bg-gray-50 border-gray-200';
    
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info':
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLevelBadge = (level: string) => {
    if (!level) return <Badge variant="outline">Info</Badge>;
    
    switch (level.toLowerCase()) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Progress</Badge>;
      case 'info':
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Live Sync Feed
            </CardTitle>
            <CardDescription>
              Real-time sync logs and progress updates
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Button
              onClick={togglePause}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            {!isConnected && (
              <Button
                onClick={reconnect}
                variant="outline"
                size="sm"
              >
                Reconnect
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] w-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs yet. Waiting for sync activity...</p>
                {!isConnected && (
                  <p className="text-sm mt-2">
                    Make sure the sync service is running on port 3005
                  </p>
                )}
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getLevelColor(log.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getLevelBadge(log.level)}
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.type && log.type !== 'log' && (
                          <Badge variant="outline" className="text-xs">
                            {log.type}
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-sm whitespace-pre-wrap">
                        {log.message}
                      </div>
                      {log.data && Object.keys(log.data).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            Show details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{logs.length} log entries</span>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="mr-2"
              />
              Auto-scroll to bottom
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncLiveFeed; 