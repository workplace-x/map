import React, { useRef, useState, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { LicenseManager } from 'ag-grid-enterprise'
import { ModuleRegistry } from 'ag-grid-community'
import {
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  PaginationModule,
} from 'ag-grid-enterprise'
import 'ag-grid-enterprise/styles/ag-theme-quartz.css'
import { ColDef } from 'ag-grid-community'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { PlusCircledIcon, TrashIcon, Pencil1Icon, CheckIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import {
  useMemberTargets,
  useTeamTargets,
  useMarginThresholds,
  useSuperTeams,
  useReferenceData
} from '../hooks'
import {
  MemberTarget,
  TeamTarget,
  MarginThreshold,
  SuperTeam,
  CreateMemberTargetRequest,
  CreateTeamTargetRequest,
  CreateMarginThresholdRequest
} from '../types'

// Set AG Grid Enterprise license key
LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY)

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ServerSideRowModelModule,
  ColumnsToolPanelModule,
  FiltersToolPanelModule,
  PaginationModule,
])

const GoalsManagementTable: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [activeTab, setActiveTab] = useState('member-targets')
  
  // Dialog states
  const [createMemberTargetOpen, setCreateMemberTargetOpen] = useState(false)
  const [createTeamTargetOpen, setCreateTeamTargetOpen] = useState(false)
  const [createThresholdOpen, setCreateThresholdOpen] = useState(false)
  const [createSuperTeamOpen, setCreateSuperTeamOpen] = useState(false)

  // Grid refs
  const memberTargetsGridRef = useRef<AgGridReact>(null)
  const teamTargetsGridRef = useRef<AgGridReact>(null)
  const thresholdsGridRef = useRef<AgGridReact>(null)
  const superTeamsGridRef = useRef<AgGridReact>(null)

  // Custom hooks
  const { teams, users, loading: loadingRef } = useReferenceData()
  const {
    memberTargets,
    loading: loadingMembers,
    createMemberTarget,
    updateMemberTarget,
    deleteMemberTarget
  } = useMemberTargets(selectedYear)
  
  const {
    teamTargets,
    loading: loadingTeams,
    createTeamTarget,
    updateTeamTarget,
    deleteTeamTarget
  } = useTeamTargets(selectedYear)
  
  const {
    marginThresholds,
    loading: loadingThresholds,
    createMarginThreshold,
    updateMarginThreshold,
    deleteMarginThreshold
  } = useMarginThresholds()
  
  // const {
  //   superTeams,
  //   createSuperTeam,
  //   updateSuperTeam,
  //   deleteSuperTeam
  // } = useSuperTeams(selectedYear)

  // Format currency
  const formatCurrency = useCallback((value: number | null) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }, [])

  // Format percentage
  const formatPercentage = useCallback((value: number | null) => {
    if (value === null || value === undefined) return '-'
    return `${value.toFixed(1)}%`
  }, [])

  // Member Targets Column Definitions
  const memberTargetsColumnDefs: ColDef<MemberTarget>[] = useMemo(() => [
    {
      headerName: 'Member',
      field: 'member_name',
      flex: 2,
      cellRenderer: (params: any) => {
        const { data } = params
        if (!data) return null
        return (
          <div className="flex flex-col">
            <span className="font-medium">{data.member_name || data.member_id}</span>
            <span className="text-xs text-muted-foreground">{data.member_email}</span>
          </div>
        )
      }
    },
    {
      headerName: 'Team',
      field: 'team_name',
      flex: 1
    },
    {
      headerName: 'ERP Salesperson',
      field: 'erp_salesperson_name',
      flex: 1
    },
    {
      headerName: 'Sales Target',
      field: 'sales_target',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatCurrency(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateMemberTarget({
            id: params.data.id,
            sales_target: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'Design Allocation',
      field: 'design_allocation',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatCurrency(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateMemberTarget({
            id: params.data.id,
            design_allocation: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'PM Allocation',
      field: 'pm_allocation',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatCurrency(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateMemberTarget({
            id: params.data.id,
            pm_allocation: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDeleteMemberTarget(params.data.id)}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [formatCurrency, updateMemberTarget])

  // Team Targets Column Definitions
  const teamTargetsColumnDefs: ColDef<TeamTarget>[] = useMemo(() => [
    {
      headerName: 'Team',
      field: 'team_name',
      flex: 2
    },
    {
      headerName: 'Members',
      field: 'member_count',
      flex: 1,
      cellRenderer: (params: any) => {
        const count = params.value || 0
        return (
          <Badge variant="secondary">
            {count} member{count !== 1 ? 's' : ''}
          </Badge>
        )
      }
    },
    {
      headerName: 'Sales Target',
      field: 'sales_target',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatCurrency(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateTeamTarget({
            id: params.data.id,
            sales_target: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'Design Allocation',
      field: 'design_allocation',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatCurrency(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateTeamTarget({
            id: params.data.id,
            design_allocation: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'PM Allocation',
      field: 'pm_allocation',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatCurrency(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateTeamTarget({
            id: params.data.id,
            pm_allocation: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'Super Team',
      field: 'is_super_team',
      flex: 1,
      cellRenderer: (params: any) => {
        return params.value ? (
          <Badge variant="outline">Super Team</Badge>
        ) : null
      }
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDeleteTeamTarget(params.data.id)}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [formatCurrency, updateTeamTarget])

  // Margin Thresholds Column Definitions
  const thresholdsColumnDefs: ColDef<MarginThreshold>[] = useMemo(() => [
    {
      headerName: 'Name',
      field: 'name',
      flex: 2,
      editable: true,
      onCellValueChanged: async (params) => {
        try {
          await updateMarginThreshold({
            id: params.data.id,
            name: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'Type',
      field: 'type',
      flex: 1,
      cellRenderer: (params: any) => {
        const typeLabels = {
          vendor: 'Vendor',
          customer: 'Customer',
          service: 'Service',
          overall: 'Overall',
          order_minimum: 'Order Minimum'
        }
        return (
          <Badge variant="outline">
            {typeLabels[params.value as keyof typeof typeLabels] || params.value}
          </Badge>
        )
      }
    },
    {
      headerName: 'Threshold %',
      field: 'threshold_percentage',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatPercentage(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateMarginThreshold({
            id: params.data.id,
            threshold_percentage: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'Threshold Amount',
      field: 'threshold_amount',
      flex: 1,
      editable: true,
      valueFormatter: (params) => formatCurrency(params.value),
      onCellValueChanged: async (params) => {
        try {
          await updateMarginThreshold({
            id: params.data.id,
            threshold_amount: params.newValue
          })
        } catch (error) {
          params.api.refreshCells({ force: true })
        }
      }
    },
    {
      headerName: 'Requires Approval',
      field: 'requires_approval',
      flex: 1,
      cellRenderer: (params: any) => {
        return params.value ? (
          <Badge variant="destructive">Required</Badge>
        ) : (
          <Badge variant="secondary">Optional</Badge>
        )
      }
    },
    {
      headerName: 'Approval Level',
      field: 'approval_level',
      flex: 1,
      cellRenderer: (params: any) => {
        if (!params.data.requires_approval) return '-'
        const levelLabels = {
          manager: 'Manager',
          director: 'Director',
          vp: 'VP'
        }
        return (
          <Badge variant="outline">
            {levelLabels[params.value as keyof typeof levelLabels] || params.value}
          </Badge>
        )
      }
    },
    {
      headerName: 'Active',
      field: 'active',
      flex: 1,
      cellRenderer: (params: any) => {
        return params.value ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )
      }
    },
    {
      headerName: 'Actions',
      field: 'id',
      width: 100,
      cellRenderer: (params: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDeleteMarginThreshold(params.data.id)}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], [formatCurrency, formatPercentage, updateMarginThreshold])

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 100,
    flex: 1
  }), [])

  // Action handlers
  const handleDeleteMemberTarget = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this member target?')) {
      try {
        await deleteMemberTarget(id)
      } catch (error) {
        console.error('Error deleting member target:', error)
      }
    }
  }, [deleteMemberTarget])

  const handleDeleteTeamTarget = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this team target?')) {
      try {
        await deleteTeamTarget(id)
      } catch (error) {
        console.error('Error deleting team target:', error)
      }
    }
  }, [deleteTeamTarget])

  const handleDeleteMarginThreshold = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this margin threshold?')) {
      try {
        await deleteMarginThreshold(id)
      } catch (error) {
        console.error('Error deleting margin threshold:', error)
      }
    }
  }, [deleteMarginThreshold])

  // Year selector
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  if (loadingRef) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        <span className="ml-3 text-base text-gray-400">Loading reference data…</span>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .shadow-quartz {
          box-shadow: 0 2px 16px 0 rgba(44, 62, 80, 0.08), 0 1.5px 4px 0 rgba(44, 62, 80, 0.04);
        }
        .bg-quartz-light {
          background: #f8fafc;
        }
        .ag-theme-quartz .ag-cell, .ag-theme-quartz .ag-header-cell-label {
          font-size: 0.75rem !important;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="year-select">Year:</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'member-targets' && (
              <Button onClick={() => setCreateMemberTargetOpen(true)}>
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Add Member Target
              </Button>
            )}
            {activeTab === 'team-targets' && (
              <Button onClick={() => setCreateTeamTargetOpen(true)}>
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Add Team Target
              </Button>
            )}
            {activeTab === 'thresholds' && (
              <Button onClick={() => setCreateThresholdOpen(true)}>
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Add Threshold
              </Button>
            )}
            {activeTab === 'super-teams' && (
              <Button onClick={() => setCreateSuperTeamOpen(true)}>
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                Create Super Team
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="member-targets">Member Targets</TabsTrigger>
            <TabsTrigger value="team-targets">Team Targets</TabsTrigger>
            <TabsTrigger value="thresholds">Margin Thresholds</TabsTrigger>
            <TabsTrigger value="super-teams">Super Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="member-targets">
            <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ 
              width: '100%', 
              borderRadius: '1rem', 
              overflow: 'hidden', 
              minHeight: 400, 
              height: '70vh',
              marginTop: 16 
            }}>
              {loadingMembers ? (
                <div className="flex items-center justify-center h-full">
                  <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                  <span className="ml-3 text-base text-gray-400">Loading member targets…</span>
                </div>
              ) : (
                <AgGridReact
                  ref={memberTargetsGridRef}
                  rowData={memberTargets}
                  columnDefs={memberTargetsColumnDefs}
                  defaultColDef={defaultColDef}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={50}
                  paginationPageSizeSelector={[25, 50, 100]}
                  sideBar={{
                    toolPanels: [
                      { id: 'columns', labelDefault: 'Columns', labelKey: 'columns', iconKey: 'columns', toolPanel: 'agColumnsToolPanel' },
                      { id: 'filters', labelDefault: 'Filters', labelKey: 'filters', iconKey: 'filter', toolPanel: 'agFiltersToolPanel' }
                    ]
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="team-targets">
            <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ 
              width: '100%', 
              borderRadius: '1rem', 
              overflow: 'hidden', 
              minHeight: 400, 
              height: '70vh',
              marginTop: 16 
            }}>
              {loadingTeams ? (
                <div className="flex items-center justify-center h-full">
                  <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                  <span className="ml-3 text-base text-gray-400">Loading team targets…</span>
                </div>
              ) : (
                <AgGridReact
                  ref={teamTargetsGridRef}
                  rowData={teamTargets}
                  columnDefs={teamTargetsColumnDefs}
                  defaultColDef={defaultColDef}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={50}
                  paginationPageSizeSelector={[25, 50, 100]}
                  sideBar={{
                    toolPanels: [
                      { id: 'columns', labelDefault: 'Columns', labelKey: 'columns', iconKey: 'columns', toolPanel: 'agColumnsToolPanel' },
                      { id: 'filters', labelDefault: 'Filters', labelKey: 'filters', iconKey: 'filter', toolPanel: 'agFiltersToolPanel' }
                    ]
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="thresholds">
            <div className='ag-theme-quartz shadow-quartz bg-quartz-light' style={{ 
              width: '100%', 
              borderRadius: '1rem', 
              overflow: 'hidden', 
              minHeight: 400, 
              height: '70vh',
              marginTop: 16 
            }}>
              {loadingThresholds ? (
                <div className="flex items-center justify-center h-full">
                  <span className="animate-spin inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                  <span className="ml-3 text-base text-gray-400">Loading margin thresholds…</span>
                </div>
              ) : (
                <AgGridReact
                  ref={thresholdsGridRef}
                  rowData={marginThresholds}
                  columnDefs={thresholdsColumnDefs}
                  defaultColDef={defaultColDef}
                  animateRows={true}
                  pagination={true}
                  paginationPageSize={50}
                  paginationPageSizeSelector={[25, 50, 100]}
                  sideBar={{
                    toolPanels: [
                      { id: 'columns', labelDefault: 'Columns', labelKey: 'columns', iconKey: 'columns', toolPanel: 'agColumnsToolPanel' },
                      { id: 'filters', labelDefault: 'Filters', labelKey: 'filters', iconKey: 'filter', toolPanel: 'agFiltersToolPanel' }
                    ]
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="super-teams">
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Super Teams</h3>
                <p className="text-muted-foreground mb-4">
                  Create super teams with shared goals across multiple salespeople
                </p>
                <Button onClick={() => setCreateSuperTeamOpen(true)}>
                  <PlusCircledIcon className="mr-2 h-4 w-4" />
                  Create Super Team
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create dialogs will be added in the next step */}
    </>
  )
}

export default GoalsManagementTable 