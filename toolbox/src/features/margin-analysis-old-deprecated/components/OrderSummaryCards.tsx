import { Card } from '@/components/ui/card'
import { OrderSummary } from '../types'
import { formatCurrency, calculateMarginPercentage } from '../utils'

interface OrderSummaryCardsProps {
  orderSummary: OrderSummary
}

export function OrderSummaryCards({ orderSummary }: OrderSummaryCardsProps) {
  const marginPercentage = calculateMarginPercentage(orderSummary.total_sell, orderSummary.total_cost)

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
      <Card className='p-4 flex flex-col justify-center'>
        <div className='mb-2'>
          <p className='text-xs text-muted-foreground mb-1'>Order #</p>
          <span className='text-lg font-bold'>{orderSummary.order_no}</span>
        </div>
        <div>
          <p className='text-xs text-muted-foreground mb-1'>Order Title</p>
          <span className='text-base font-semibold'>
            {orderSummary.order_title || '-'}
          </span>
        </div>
      </Card>

      <Card className='p-4 flex flex-col justify-center'>
        <div className='mb-2'>
          <p className='text-xs text-muted-foreground mb-1'>Customer</p>
          <span className='text-lg font-bold'>{orderSummary.customer_name}</span>
        </div>
        <div>
          <p className='text-xs text-muted-foreground mb-1'>Salesperson</p>
          <span className='text-base font-semibold'>
            {orderSummary.salesperson_name || '-'}
          </span>
        </div>
      </Card>

      <Card className='p-4 flex flex-col justify-center'>
        <div className='mb-2'>
          <p className='text-xs text-muted-foreground mb-1'>Total Sell</p>
          <span className='text-lg font-bold'>
            ${formatCurrency(orderSummary.total_sell)}
          </span>
        </div>
        <div>
          <p className='text-xs text-muted-foreground mb-1'>Total Cost</p>
          <span className='text-lg font-bold'>
            ${formatCurrency(orderSummary.total_cost)}
          </span>
        </div>
      </Card>

      <Card className='p-4 flex flex-col justify-center'>
        <div className='mb-2'>
          <p className='text-xs text-muted-foreground mb-1'>Overall Margin</p>
          <span className='text-lg font-bold'>
            ${formatCurrency(orderSummary.total_sell - orderSummary.total_cost)}
          </span>
        </div>
        <div>
          <p className='text-xs text-muted-foreground mb-1'>Margin %</p>
          <span className='text-lg font-bold'>
            {marginPercentage.toFixed(2)}%
          </span>
        </div>
      </Card>
    </div>
  )
} 