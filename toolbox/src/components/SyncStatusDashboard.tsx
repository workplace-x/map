import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RefreshCw, Play, CheckCircle, AlertCircle, Clock, Database, Activity } from 'lucide-react';
import SyncLiveFeed from './SyncLiveFeed';

interface SyncStats {
  recordsInserted: number;
  recordsUpdated: number;
  errors: number;
  tablesProcessed: number;
  startTime: string | null;
  endTime: string | null;
}

interface SyncResult {
  status: string;
  stats: SyncStats;
  timestamp: string;
  duration: number;
  strategy: string;
}

interface HealthStatus {
  healthy: boolean;
  lastSyncResult: SyncResult | null;
  consecutiveFailures: number;
  uptime: number;
  timestamp: string;
}

interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: string;
  stats: SyncStats;
  totalTables: number;
  strategy: string;
}

const SyncStatusDashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Enhanced Sync is now integrated into the main API server
  const SYNC_SERVICE_URL = process.env.NODE_ENV === 'production' 
    ? '/api/sync'  // Use nginx proxy in production
    : '/api/sync'; // Use relative path through nginx proxy in development

  const fetchSyncData = async () => {
    try {
      // Use the integrated sync status endpoint (which includes health info)
      const statusResponse = await fetch(`${SYNC_SERVICE_URL}/status`);

      if (statusResponse.ok) {
        const syncData = await statusResponse.json();
        
        // Map the Enhanced Sync response to our component's expected format
        setHealthStatus({
          healthy: syncData.health?.healthy || true,
          lastSyncResult: syncData.lastSyncResult || null,
          consecutiveFailures: syncData.health?.consecutiveFailures || 0,
          uptime: syncData.uptime || 0,
          timestamp: syncData.timestamp || new Date().toISOString()
        });

        setSyncStatus({
          isRunning: syncData.isRunning || false,
          lastSyncTime: syncData.lastSync || '',
          stats: {
            recordsInserted: 0,
            recordsUpdated: 0,
            errors: 0,
            tablesProcessed: 0,
            startTime: null,
            endTime: null
          },
          totalTables: syncData.tables?.total || 0,
          strategy: 'enhanced-incremental'
        });
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch sync data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualSync = async () => {
    setIsTriggering(true);
    try {
      const response = await fetch(`${SYNC_SERVICE_URL}/trigger`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh data after triggering
        setTimeout(fetchSyncData, 1000);
      } else {
        console.error('Failed to trigger sync');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSyncData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getHealthBadge = () => {
    if (!healthStatus) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    if (healthStatus.healthy) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Healthy
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unhealthy
        </Badge>
      );
    }
  };

  const getSyncStatusBadge = () => {
    if (!syncStatus) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    if (syncStatus.isRunning) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <Clock className="w-3 h-3 mr-1" />
          Idle
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading sync status...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Sync Status</h1>
          <p className="text-gray-600">Monitor incremental data synchronization between Azure and Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchSyncData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={triggerManualSync}
            disabled={isTriggering || syncStatus?.isRunning}
            size="sm"
          >
            <Play className={`w-4 h-4 mr-2 ${isTriggering ? 'animate-spin' : ''}`} />
            {isTriggering ? 'Triggering...' : 'Manual Sync'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="status" className="flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Status & Metrics
          </TabsTrigger>
          <TabsTrigger value="livefeed" className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            Live Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6 mt-6">
          {/* Service Health */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Health</CardTitle>
                {getHealthBadge()}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthStatus ? formatUptime(healthStatus.uptime) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Service uptime</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                {getSyncStatusBadge()}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncStatus?.totalTables || 0} tables
                </div>
                <p className="text-xs text-muted-foreground">In sync pipeline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consecutive Failures</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthStatus?.consecutiveFailures || 0}
                </div>
                <p className="text-xs text-muted-foreground">Error count</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Sync Progress */}
          {syncStatus?.isRunning && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Sync in Progress
                </CardTitle>
                <CardDescription>
                  Tables processed: {syncStatus.stats.tablesProcessed} / {syncStatus.totalTables}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={(syncStatus.stats.tablesProcessed / syncStatus.totalTables) * 100} 
                  className="mb-4"
                />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-600">{syncStatus.stats.recordsInserted}</span> inserted
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">{syncStatus.stats.recordsUpdated}</span> updated
                  </div>
                  <div>
                    <span className="font-medium text-red-600">{syncStatus.stats.errors}</span> errors
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Sync Results */}
          {healthStatus?.lastSyncResult && (
            <Card>
              <CardHeader>
                <CardTitle>Last Sync Results</CardTitle>
                <CardDescription>
                  Completed {new Date(healthStatus.lastSyncResult.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {healthStatus.lastSyncResult.stats.recordsInserted}
                    </div>
                    <div className="text-sm text-muted-foreground">Inserted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {healthStatus.lastSyncResult.stats.recordsUpdated}
                    </div>
                    <div className="text-sm text-muted-foreground">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {healthStatus.lastSyncResult.stats.errors}
                    </div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatDuration(healthStatus.lastSyncResult.duration)}
                    </div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span>Status: <Badge variant={healthStatus.lastSyncResult.status === 'completed' ? 'default' : 'destructive'}>
                    {healthStatus.lastSyncResult.status}
                  </Badge></span>
                  <span>Strategy: {healthStatus.lastSyncResult.strategy}</span>
                  <span>Tables: {healthStatus.lastSyncResult.stats.tablesProcessed}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Service URL</TableCell>
                    <TableCell>{SYNC_SERVICE_URL}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Last Update</TableCell>
                    <TableCell>{lastUpdate.toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Auto Refresh</TableCell>
                    <TableCell>Every 30 seconds</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sync Schedule</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>• Every 15 minutes (Business hours: 8 AM - 6 PM PST, Mon-Fri)</div>
                        <div>• Every hour (Off hours and weekends)</div>
                        <div>• Manual triggers available</div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Service Offline Alert */}
          {!healthStatus && !isLoading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to connect to Enhanced Sync service at {SYNC_SERVICE_URL}. 
                Please ensure the API server is running and Enhanced Sync is initialized.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="livefeed" className="mt-6">
          <SyncLiveFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncStatusDashboard; 