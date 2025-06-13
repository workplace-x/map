import React from 'react';
import { BarChart, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function AnalysisPanel() {
  return (
    <div className="h-1/2 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Analysis</h3>
        <BarChart className="w-4 h-4 text-gray-500" />
      </div>

      <div className="space-y-3 max-h-48 overflow-y-auto">
        <Card className="p-3">
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Document Score</h4>
              <p className="text-xs text-gray-600 mt-1">
                No analysis available yet. Upload documents to get started.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Requirements</h4>
              <p className="text-xs text-gray-600 mt-1">
                Compliance analysis will appear here.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Recommendations</h4>
              <p className="text-xs text-gray-600 mt-1">
                AI-powered suggestions will be shown here.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 