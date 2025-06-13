import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { FaMedal } from 'react-icons/fa'
import { cn } from '@/lib/utils'

const trophyColors = ['#FFD700', '#C0C0C0', '#CD7F32'] // Gold, Silver, Bronze

function LeaderboardList({ data, valueFormatter }: { data: any[], valueFormatter: (v: number) => string }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div className='text-center text-muted-foreground py-8'>No data available.</div>;
  }
  return (
    <div className='space-y-4'>
      {data.map((item, idx) => (
        <div key={item.salesperson_id || idx} className='flex items-center gap-4'>
          <div className='relative'>
            <Avatar className='h-9 w-9'>
              {/* Optionally add AvatarImage here if you have URLs */}
              <AvatarFallback>{item.salesperson_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            {idx < 3 && (
              <span className='absolute -top-2 -right-2'>
                <FaMedal style={{ color: trophyColors[idx], fontSize: 20 }} title={['Gold','Silver','Bronze'][idx]} />
              </span>
            )}
          </div>
          <div className='flex-1'>
            <div className='font-medium text-sm'>{item.salesperson_name}</div>
          </div>
          <div className='font-bold text-base tabular-nums'>
            {valueFormatter(Number(item.value))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function LeaderboardCard() {
  const [tab, setTab] = useState('bookings')
  const [metric, setMetric] = useState<'sales' | 'gp'>('sales')
  const [bookingsSales, setBookingsSales] = useState<any[]>([])
  const [bookingsGP, setBookingsGP] = useState<any[]>([])
  const [invoicesSales, setInvoicesSales] = useState<any[]>([])
  const [invoicesGP, setInvoicesGP] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/bookings-leaderboard-sales-this-month').then(r=>r.json()).then(d => setBookingsSales(Array.isArray(d) ? d : []))
    fetch('/api/bookings-leaderboard-gp-this-month').then(r=>r.json()).then(d => setBookingsGP(Array.isArray(d) ? d : []))
    fetch('/api/invoices-leaderboard-sales-this-month').then(r=>r.json()).then(d => setInvoicesSales(Array.isArray(d) ? d : []))
    fetch('/api/invoices-leaderboard-gp-this-month').then(r=>r.json()).then(d => setInvoicesGP(Array.isArray(d) ? d : []))
  },[])
  // Reset metric to 'sales' when switching main tab
  useEffect(() => { setMetric('sales') }, [tab])
  const valueFormatter = (v: number) => v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  return (
    <Tabs defaultValue='bookings' value={tab} onValueChange={setTab} className='w-full'>
      <TabsList className='w-full grid grid-cols-3 mb-2'>
        <TabsTrigger value='bookings'>Bookings</TabsTrigger>
        <TabsTrigger value='invoices'>Invoices</TabsTrigger>
        <TabsTrigger value='opportunities'>Opportunities</TabsTrigger>
      </TabsList>
      <TabsContent value='bookings' forceMount>
        <div className='flex justify-end mb-4'>
          <div className='inline-flex rounded-md bg-muted p-1'>
            <button
              className={cn(
                'px-4 py-1 rounded-md text-sm font-semibold transition-colors',
                metric === 'sales' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              )}
              onClick={() => setMetric('sales')}
              type='button'
            >
              Sales
            </button>
            <button
              className={cn(
                'px-4 py-1 rounded-md text-sm font-semibold transition-colors',
                metric === 'gp' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              )}
              onClick={() => setMetric('gp')}
              type='button'
            >
              Gross Profit
            </button>
          </div>
        </div>
        {metric === 'sales' ? (
          <LeaderboardList data={Array.isArray(bookingsSales) ? bookingsSales : []} valueFormatter={valueFormatter} />
        ) : (
          <LeaderboardList data={Array.isArray(bookingsGP) ? bookingsGP : []} valueFormatter={valueFormatter} />
        )}
      </TabsContent>
      <TabsContent value='invoices' forceMount>
        <div className='flex justify-end mb-4'>
          <div className='inline-flex rounded-md bg-muted p-1'>
            <button
              className={cn(
                'px-4 py-1 rounded-md text-sm font-semibold transition-colors',
                metric === 'sales' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              )}
              onClick={() => setMetric('sales')}
              type='button'
            >
              Sales
            </button>
            <button
              className={cn(
                'px-4 py-1 rounded-md text-sm font-semibold transition-colors',
                metric === 'gp' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
              )}
              onClick={() => setMetric('gp')}
              type='button'
            >
              Gross Profit
            </button>
          </div>
        </div>
        {metric === 'sales' ? (
          <LeaderboardList data={Array.isArray(invoicesSales) ? invoicesSales : []} valueFormatter={valueFormatter} />
        ) : (
          <LeaderboardList data={Array.isArray(invoicesGP) ? invoicesGP : []} valueFormatter={valueFormatter} />
        )}
      </TabsContent>
      <TabsContent value='opportunities' forceMount>
        <div className='text-center text-muted-foreground py-8'>Opportunities leaderboard coming soon...</div>
      </TabsContent>
    </Tabs>
  )
}
