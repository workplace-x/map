import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Building, Target, ShieldCheck, TrendingUp, Table } from 'lucide-react'
import GoalsManagementTable from './goals-management/components/GoalsManagementTable'
import { IntelligentTeamHierarchy } from './components/IntelligentTeamHierarchy'
import { SmartGoalsManagement } from './components/SmartGoalsManagement'
import { HierarchySalesGoals } from './components/HierarchySalesGoals'
import { SalesGoalsTable } from './components/SalesGoalsTable'

export default function GoalsManagementPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState('sales-goals-table');

  // Generate year options (current year and next 2 years)
  const yearOptions = [
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2
  ];

  return (
    <div className="w-full h-full flex flex-col px-8">
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
        <h2 className="text-2xl font-bold mb-2">Sales Goals & Team Management</h2>
        <p className="text-gray-500">
              Individual member goals that roll up to team totals, plus team hierarchy and threshold management.
        </p>
      </div>

          {/* Year Selector */}
          <div className="flex items-center gap-4">
            <Label htmlFor="year-select" className="text-sm font-medium">
              Goal Year:
            </Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]" id="year-select">
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
          <TabsTrigger value="sales-goals-table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Sales Goals
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Team Hierarchy
          </TabsTrigger>
          <TabsTrigger value="hierarchy-goals" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Advanced Goals
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Margin Thresholds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales-goals-table" className="mt-6 flex-1 overflow-y-auto">
          <SalesGoalsTable selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="teams" className="mt-6 flex-1 overflow-y-auto">
          <IntelligentTeamHierarchy />
        </TabsContent>

        <TabsContent value="hierarchy-goals" className="mt-6 flex-1 overflow-y-auto">
          <HierarchySalesGoals selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="thresholds" className="mt-6 flex-1 overflow-y-auto">
          <GoalsManagementTable />
        </TabsContent>
      </Tabs>
    </div>
  )
} 