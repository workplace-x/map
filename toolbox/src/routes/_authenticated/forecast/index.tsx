import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, BarChart3, Target, Brain, Calendar } from 'lucide-react'
import HierarchyTeamForecast from '@/features/forecast/components/HierarchyTeamForecast'
import PredictiveForecastDashboard from '@/features/forecast/components/PredictiveForecastDashboard'
import GapReportDashboard from '@/features/forecast/components/GapReportDashboard'

function Forecast() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  
  // Generate year options (current year and 2 years before/after)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forecast Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage team forecasts, analyze performance, and leverage predictive models
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
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

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Manual Forecast
          </TabsTrigger>
          <TabsTrigger value="gap-report" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Gap Report
            <Badge variant="default" className="ml-2 bg-green-600">New</Badge>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2" disabled>
            <BarChart3 className="h-4 w-4" />
            Performance Analysis
            <Badge variant="secondary" className="ml-2">Soon</Badge>
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Predictive Model
            <Badge variant="default" className="ml-2 bg-purple-600">New</Badge>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2" disabled>
            <Target className="h-4 w-4" />
            Forecast Settings
            <Badge variant="secondary" className="ml-2">Soon</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <HierarchyTeamForecast selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="gap-report" className="space-y-6">
          <GapReportDashboard selectedYear={selectedYear} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Performance Analysis Coming Soon</h3>
                <p className="text-sm">
                  Compare forecasted vs actual performance with detailed analytics and insights.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveForecastDashboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Forecast Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Settings Coming Soon</h3>
                <p className="text-sm">
                  Configure forecast lock dates, auto-rollup settings, and notification preferences.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/forecast/')({
  component: Forecast,
}) 