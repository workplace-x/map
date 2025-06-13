// Note: Component seems to be a wrapper or utility without direct JSX usage
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingsThisMonthTable from './BookingsThisMonthTable';
import InvoicesThisMonthTable from './InvoicesThisMonthTable';

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ... existing cards ... */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="bookings" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              </TabsList>
              <TabsContent value="bookings" className="mt-4">
                <BookingsThisMonthTable />
              </TabsContent>
              <TabsContent value="invoices" className="mt-4">
                <InvoicesThisMonthTable />
              </TabsContent>
              <TabsContent value="opportunities" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  Opportunities table coming soon...
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ... existing overview content ... */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 