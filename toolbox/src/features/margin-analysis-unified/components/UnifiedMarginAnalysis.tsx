'use client'

import React, { useState } from 'react'
import { SearchInterface } from './SearchInterface'
import { AnalysisResults } from './AnalysisResults'
import { TeamLeaderDashboard } from './TeamLeaderDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SearchResult {
  id: string
  order_no: string
  type: 'quote' | 'order'
  display_name: string
  customer_no: string
  customer_name?: string
  date_entered: string
  sell_value: number
  margin_pct: number
  status: string
  relevance_score: number
}

export function UnifiedMarginAnalysis() {
  const [activeTab, setActiveTab] = useState('search')
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  const handleAnalysisComplete = (analysis: any) => {
    setAnalysisData(analysis)
    setActiveTab('results')
  }

  const handleSelectResult = (result: SearchResult) => {
    setSelectedResult(result)
  }

  const handleNewSearch = () => {
    setSelectedResult(null)
    setAnalysisData(null)
    setActiveTab('search')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Unified Margin Analysis
        </h1>
        <p className="text-gray-600 mt-1">
          Search-first approach to quote analysis and margin optimization
        </p>
      </div>

      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisData}>
              Analysis Results
            </TabsTrigger>
            <TabsTrigger value="approvals">Team Dashboard</TabsTrigger>
          </TabsList>

          <div className="mt-6 h-full">
            <TabsContent value="search" className="h-full">
              <SearchInterface
                onAnalysisComplete={handleAnalysisComplete}
                onSelectResult={handleSelectResult}
                selectedResult={selectedResult}
              />
            </TabsContent>

            <TabsContent value="results" className="h-full">
              {analysisData && (
                <AnalysisResults
                  analysis={analysisData}
                  onNewSearch={handleNewSearch}
                />
              )}
            </TabsContent>

            <TabsContent value="approvals" className="h-full">
              <TeamLeaderDashboard />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 