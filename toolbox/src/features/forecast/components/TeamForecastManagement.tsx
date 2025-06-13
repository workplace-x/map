import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Lock, 
  Unlock, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import {
  ForecastMatrixData,
  TeamForecastRow,
  ForecastMonthData,
  CreateForecastRequest,
  BulkForecastRequest,
  LockForecastRequest,
  MONTH_ABBR,
  CONFIDENCE_LEVELS,
  ConfidenceLevel
} from '@/types/forecasts';

interface TeamForecastManagementProps {
  className?: string;
}

interface EditingCell {
  teamId: string;
  month: number;
  field: 'forecasted_revenue' | 'forecasted_bookings' | 'forecasted_gp_dollars' | 'forecasted_gp_percentage' | 'confidence_level' | 'notes';
  value: string;
}

const TeamForecastManagement: React.FC<TeamForecastManagementProps> = ({ className }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [forecastType, setForecastType] = useState<string>('manual');
  const [forecastData, setForecastData] = useState<ForecastMatrixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, CreateForecastRequest>>(new Map());
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockDialogData, setLockDialogData] = useState<{ month: number; isLocked: boolean } | null>(null);

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // Fetch forecast data
  const fetchForecastData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team-forecasts/matrix?year=${selectedYear}&forecast_type=${forecastType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
      }
      const data = await response.json();
      setForecastData(data);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      toast.error('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecastData();
  }, [selectedYear, forecastType]);

  // Handle cell editing
  const handleCellEdit = (teamId: string, month: number, field: string, currentValue: any) => {
    setEditingCell({
      teamId,
      month,
      field: field as EditingCell['field'],
      value: currentValue?.toString() || ''
    });
  };

  const handleCellSave = () => {
    if (!editingCell || !forecastData) return;

    const { teamId, month, field, value } = editingCell;
    const changeKey = `${teamId}-${month}`;
    
    // Get existing pending change or create new one
    const existingChange = pendingChanges.get(changeKey) || {
      team_id: teamId,
      year: selectedYear,
      month,
      forecast_type: forecastType as any
    };

    // Update the specific field
    let parsedValue: any = value;
    if (field === 'confidence_level') {
      parsedValue = value ? parseInt(value) : null;
    } else if (field !== 'notes') {
      parsedValue = value ? parseFloat(value) : null;
    }

    const updatedChange = {
      ...existingChange,
      [field]: parsedValue
    };

    // Update pending changes
    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(changeKey, updatedChange);
    setPendingChanges(newPendingChanges);

    // Update local data for immediate UI feedback
    if (forecastData) {
      const updatedData = { ...forecastData };
      const teamRow = updatedData.teams.find(t => t.team_id === teamId);
      if (teamRow) {
        teamRow.months[month] = {
          ...teamRow.months[month],
          [field]: parsedValue
        };
      }
      setForecastData(updatedData);
    }

    setEditingCell(null);
    
    toast('Change queued. Click Save All Changes to persist.');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // Save all pending changes
  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) {
      toast('No changes to save');
      return;
    }

    setLoading(true);
    try {
      const forecasts = Array.from(pendingChanges.values());
      const response = await fetch('/api/team-forecasts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forecasts }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save forecasts');
      }

      setPendingChanges(new Map());
      await fetchForecastData(); // Refresh data
      
      toast.success(`Saved ${forecasts.length} forecast changes`);
    } catch (error) {
      console.error('Error saving forecasts:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save forecasts");
    } finally {
      setLoading(false);
    }
  };

  // Discard pending changes
  const discardChanges = () => {
    setPendingChanges(new Map());
    fetchForecastData(); // Refresh to original state
    toast('All pending changes have been discarded');
  };

  // Handle month locking
  const handleLockMonth = (month: number, isCurrentlyLocked: boolean) => {
    setLockDialogData({ month, isLocked: !isCurrentlyLocked });
    setShowLockDialog(true);
  };

  const confirmLockAction = async () => {
    if (!lockDialogData) return;

    setLoading(true);
    try {
      const response = await fetch('/api/team-forecasts/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          month: lockDialogData.month,
          is_locked: lockDialogData.isLocked
        } as LockForecastRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lock status');
      }

      await fetchForecastData(); // Refresh data
      setShowLockDialog(false);
      setLockDialogData(null);
      
      toast.success(`${MONTH_ABBR[lockDialogData.month - 1]} ${lockDialogData.isLocked ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      console.error('Error updating lock status:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update lock status");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '—';
    return `${value.toFixed(1)}%`;
  };

  // Get confidence badge
  const getConfidenceBadge = (level: number | null | undefined) => {
    if (!level) return <span className="text-gray-400">—</span>;
    
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge variant="outline" className={colors[level as ConfidenceLevel]}>
        {CONFIDENCE_LEVELS[level as ConfidenceLevel]}
      </Badge>
    );
  };

  // Check if month is past (for automatic locking)
  const isMonthPast = (month: number): boolean => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    return selectedYear < currentYear || (selectedYear === currentYear && month < currentMonth);
  };

  // Render editable cell
  const renderEditableCell = (
    team: TeamForecastRow,
    month: number,
    field: keyof ForecastMonthData,
    value: any,
    formatter?: (val: any) => string
  ) => {
    const isEditing = editingCell?.teamId === team.team_id && 
                     editingCell?.month === month && 
                     editingCell?.field === field;
    const monthData = team.months[month];
    const canEdit = monthData.can_edit && !monthData.is_locked;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            className="h-8 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
          />
          <Button size="sm" variant="ghost" onClick={handleCellSave} className="h-6 w-6 p-0">
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCellCancel} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    const displayValue = formatter ? formatter(value) : (value?.toString() || '—');
    const isChanged = pendingChanges.has(`${team.team_id}-${month}`);

    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 p-1 rounded text-xs ${canEdit ? 'hover:bg-blue-50' : ''} ${isChanged ? 'bg-yellow-50 border border-yellow-200' : ''}`}
        onClick={() => canEdit && handleCellEdit(team.team_id, month, field as string, value)}
        title={canEdit ? 'Click to edit' : 'Locked - Cannot edit'}
      >
        <div className="flex items-center justify-between">
          {displayValue}
          {canEdit && <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100" />}
          {monthData.is_locked && <Lock className="h-3 w-3 text-gray-400" />}
        </div>
      </div>
    );
  };

  if (loading && !forecastData) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Team Forecast Management
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage manual forecasts by team and month. Past months are automatically locked.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={forecastType} onValueChange={setForecastType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="predictive">Predictive</SelectItem>
                  <SelectItem value="adjusted">Adjusted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {pendingChanges.size > 0 && (
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {pendingChanges.size} unsaved change{pendingChanges.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={discardChanges}>
                  Discard Changes
                </Button>
                <Button size="sm" onClick={saveAllChanges} disabled={loading}>
                  {loading ? 'Saving...' : 'Save All Changes'}
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {forecastData && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 text-left font-medium sticky left-0 z-10 bg-gray-50">
                      Team
                    </th>
                    {MONTH_ABBR.map((month, index) => {
                      const monthNum = index + 1;
                      const monthData = forecastData.teams[0]?.months[monthNum];
                      const isPast = isMonthPast(monthNum);
                      const isLocked = monthData?.is_locked;
                      
                      return (
                        <th key={month} className="border p-2 bg-gray-50 text-center relative group">
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-medium">{month}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() => handleLockMonth(monthNum, !!isLocked)}
                              title={isLocked ? 'Unlock month' : 'Lock month'}
                            >
                              {isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            </Button>
                          </div>
                          {isPast && (
                            <div className="absolute top-0 right-0 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-orange-400" 
                                 title="Past month" />
                          )}
                          {isLocked && (
                            <div className="absolute top-0 left-0 w-0 h-0 border-r-8 border-r-transparent border-t-8 border-t-red-400" 
                                 title="Locked month" />
                          )}
                        </th>
                      );
                    })}
                    <th className="border p-2 bg-gray-50 text-center font-medium">Total</th>
                  </tr>
                </thead>
                
                <tbody>
                  {forecastData.teams.map((team) => (
                    <tr key={team.team_id} className="group hover:bg-gray-25">
                      <td className="border p-2 font-medium sticky left-0 z-10 bg-white group-hover:bg-gray-25">
                        <div className="flex items-center gap-2">
                          <span>{team.team_name}</span>
                          {team.is_super_team && (
                            <Badge variant="outline" className="text-xs">Super</Badge>
                          )}
                        </div>
                      </td>
                      
                      {Array.from({ length: 12 }, (_, index) => {
                        const month = index + 1;
                        const monthData = team.months[month];
                        
                        return (
                          <td key={month} className="border p-1 text-center relative group/cell">
                            <div className="space-y-1">
                              {/* Revenue */}
                              {renderEditableCell(
                                team, 
                                month, 
                                'forecasted_revenue', 
                                monthData.forecasted_revenue, 
                                formatCurrency
                              )}
                              
                              {/* Confidence */}
                              <div className="text-xs">
                                {renderEditableCell(
                                  team, 
                                  month, 
                                  'confidence_level', 
                                  monthData.confidence_level,
                                  (level) => level ? CONFIDENCE_LEVELS[level as ConfidenceLevel] : '—'
                                )}
                              </div>
                            </div>
                            
                            {/* Notes indicator */}
                            {monthData.notes && (
                              <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full" 
                                   title={monthData.notes} />
                            )}
                          </td>
                        );
                      })}
                      
                      <td className="border p-2 text-center font-medium bg-gray-50">
                        {formatCurrency(
                          Object.values(team.months).reduce((sum, month) => 
                            sum + (month.forecasted_revenue || 0), 0
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Totals row */}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border p-2 sticky left-0 z-10 bg-gray-100">TOTAL</td>
                    {Array.from({ length: 12 }, (_, index) => {
                      const month = index + 1;
                      const total = forecastData.monthly_totals[month]?.total_revenue || 0;
                      return (
                        <td key={month} className="border p-2 text-center">
                          {formatCurrency(total)}
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center bg-gray-200">
                      {formatCurrency(
                        Object.values(forecastData.monthly_totals).reduce((sum, month) => 
                          sum + month.total_revenue, 0
                        )
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lock/Unlock Confirmation Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lockDialogData?.isLocked ? 'Lock' : 'Unlock'} Month
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {lockDialogData?.isLocked ? 'lock' : 'unlock'} {lockDialogData ? MONTH_ABBR[lockDialogData.month - 1] : ''} {selectedYear}?
              {lockDialogData?.isLocked && ' This will prevent all future edits to this month.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLockAction} disabled={loading}>
              {loading ? 'Processing...' : (lockDialogData?.isLocked ? 'Lock Month' : 'Unlock Month')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamForecastManagement; 