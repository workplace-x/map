import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApprovalStatus } from '../hooks'

interface ApprovalSectionProps {
  orderNo: string
}

export function ApprovalSection({ orderNo }: ApprovalSectionProps) {
  const {
    approval,
    loading,
    error,
    submitting,
    submitForApproval,
    canSubmit
  } = useApprovalStatus(orderNo)

  if (!orderNo) return null

  return (
    <Card className='p-4 mb-4'>
      <h2 className='text-lg font-semibold mb-2'>Approval Status</h2>
      
      {loading ? (
        <p>Loading approval status...</p>
      ) : approval ? (
        <div>
          <p>
            Status: <span className='font-bold capitalize'>{approval.status}</span>
          </p>
          {approval.manager_comment && (
            <p className='mt-1 text-sm text-muted-foreground'>
              Manager comment: {approval.manager_comment}
            </p>
          )}
        </div>
      ) : canSubmit ? (
        <Button onClick={submitForApproval} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      ) : (
        <p className='text-muted-foreground'>
          Unable to submit for approval at this time.
        </p>
      )}
      
      {error && (
        <p className='text-destructive mt-2'>{error}</p>
      )}
    </Card>
  )
} 