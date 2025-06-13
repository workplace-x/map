import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Clock, User, DollarSign, TrendingDown, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApprovalRequest, TeamApprovalData } from '../types'

export function TeamLeaderDashboard() {
  const [approvalData, setApprovalData] = useState<TeamApprovalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadApprovalData()
  }, [])

  const loadApprovalData = async () => {
    try {
      const response = await fetch('/api/margin-analysis-unified/team-approvals')
      if (response.ok) {
        const data = await response.json()
        setApprovalData(data)
      }
    } catch (error) {
      console.error('Failed to load approval data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (requestId: string, action: 'approved' | 'rejected') => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/margin-analysis-unified/approvals/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comments: comment,
          reviewed_by: 'current_user' // TODO: Get from auth context
        })
      })

      if (response.ok) {
        // Refresh data
        await loadApprovalData()
        setSelectedRequest(null)
        setComment('')
      }
    } catch (error) {
      console.error('Failed to process approval:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading approval requests...</p>
        </div>
      </div>
    )
  }

  if (!approvalData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load approval data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Team Approvals</h2>
        <p className="text-muted-foreground">
          Review and approve margin analysis requests from your team
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{approvalData.team_performance.total_pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{approvalData.team_performance.avg_approval_time.toFixed(1)}h</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold">{(approvalData.team_performance.approval_rate * 100).toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Reviews */}
      {approvalData.priority_reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Priority Reviews ({approvalData.priority_reviews.length})
          </h3>
          <div className="grid gap-3">
            {approvalData.priority_reviews.map((request) => (
              <Card key={request.id} className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">Quote {request.quote_no}</h4>
                        <Badge variant="destructive">{request.flags.length} critical issues</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.salesperson_name} • {getTimeAgo(request.created_at)}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <ApprovalDialog 
                          request={request}
                          onApprove={() => handleApproval(request.id, 'approved')}
                          onReject={() => handleApproval(request.id, 'rejected')}
                          comment={comment}
                          setComment={setComment}
                          processing={processing}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Pending Approvals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          All Pending Approvals ({approvalData.pending_approvals.length})
        </h3>
        
        {approvalData.pending_approvals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending approval requests at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {approvalData.pending_approvals.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">Quote {request.quote_no}</h4>
                        <Badge variant={request.priority === 'high' ? 'destructive' : 'secondary'}>
                          {request.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {request.flags.length} flags
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.salesperson_name} • {getTimeAgo(request.created_at)}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {request.flags.slice(0, 3).map((flag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {flag.type.replace('_', ' ')}
                          </Badge>
                        ))}
                        {request.flags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{request.flags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <ApprovalDialog 
                          request={request}
                          onApprove={() => handleApproval(request.id, 'approved')}
                          onReject={() => handleApproval(request.id, 'rejected')}
                          comment={comment}
                          setComment={setComment}
                          processing={processing}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Approval Dialog Component
function ApprovalDialog({ 
  request, 
  onApprove, 
  onReject, 
  comment, 
  setComment, 
  processing 
}: {
  request: ApprovalRequest
  onApprove: () => void
  onReject: () => void
  comment: string
  setComment: (comment: string) => void
  processing: boolean
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-blue-500 bg-blue-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Approval Request - Quote {request.quote_no}</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Request Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Salesperson</p>
            <p className="font-semibold">{request.salesperson_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p className="font-semibold">{new Date(request.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Flags */}
        <div>
          <h4 className="font-semibold mb-3">Issues Identified ({request.flags.length})</h4>
          <div className="space-y-2">
            {request.flags.map((flag) => (
              <div key={flag.id} className={`border rounded-lg p-3 ${getSeverityColor(flag.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium">{flag.message}</h5>
                    <p className="text-sm mt-1">{flag.recommendation}</p>
                    {flag.line_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Line: {flag.line_id}
                      </p>
                    )}
                  </div>
                  <Badge variant={flag.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {flag.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="text-sm font-medium mb-2 block">Comments</label>
          <Textarea
            placeholder="Add comments about your approval decision..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button 
            variant="destructive" 
            onClick={onReject}
            disabled={processing}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button 
            onClick={onApprove}
            disabled={processing}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>
    </>
  )
} 