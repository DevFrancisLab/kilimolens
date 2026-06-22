import React, { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import DashboardLayout from '@/components/dashboard/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MapPin, Calendar, CreditCard, Activity, Seedling, Layers, Archive } from 'lucide-react';

export const Route = createFileRoute('/dashboard/farmer/:id')({
  head: () => ({ meta: [{ title: 'Farmer Profile — KilimoLens' }] }),
  component: FarmerProfile,
});

function MiniTimeline({ events }: { events: Array<{ date: string; title: string; detail?: string }> }) {
  return (
    <div className="space-y-3">
      {events.map((e) => (
        <div key={e.date} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-muted" />
          <div>
            <div className="text-sm font-medium">{e.title}</div>
            <div className="text-xs text-muted-foreground">{e.date} · {e.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FarmerProfile() {
  // Mock data for now
  const farmer = useMemo(() => ({
    id: 'farmer-001',
    fullName: 'Grace Njeri',
    nationalId: 'A1234567',
    phone: '+254712345678',
    gender: 'Female',
    age: 38,
    county: 'Meru',
    subCounty: 'Imenti North',
    ward: 'Nchiru',
    village: 'Kianjai',
    gps: '-0.0667, 37.6453',
  }), []);

  const farmHistory = useMemo(() => [
    { year: 2020, crop: 'Maize', yield: '2,400 kg' },
    { year: 2021, crop: 'Maize', yield: '2,700 kg' },
    { year: 2022, crop: 'Beans', yield: '1,200 kg' },
    { year: 2023, crop: 'Maize + Beans', yield: 'Mixed' },
  ], []);

  const loanHistory = useMemo(() => [
    { date: '2021-05-10', product: 'Seasonal Loan', amount: 25000, status: 'Repaid' },
    { date: '2022-03-18', product: 'Input Loan', amount: 15000, status: 'Repaid' },
    { date: '2024-01-20', product: 'Climate Loan', amount: 40000, status: 'Outstanding' },
  ], []);

  const assessments = useMemo(() => [
    { date: '2023-11-01', score: 61, decision: 'Conditional approval' },
    { date: '2024-08-12', score: 68, decision: 'Approved (monitor)' },
  ], []);

  const climateHistory = useMemo(() => [
    { year: 2020, rainfall: 520 },
    { year: 2021, rainfall: 480 },
    { year: 2022, rainfall: 430 },
    { year: 2023, rainfall: 600 },
  ], []);

  const timeline = useMemo(() => [
    { date: '2020-03-01', title: 'Joined SACCO', detail: 'Took first seasonal loan' },
    { date: '2021-05-11', title: 'Loan repaid', detail: 'Seasonal loan cleared' },
    { date: '2023-11-01', title: 'Assessment', detail: 'Conditional approval' },
    { date: '2024-01-20', title: 'New loan applied', detail: 'Climate loan' },
  ], []);

  // Knowledge graph summary (mock)
  const kgSummary = useMemo(() => ({
    nodes: [
      { id: 'sacco', label: 'SACCO', relation: 'Member since 2020' },
      { id: 'coop', label: 'Cooperative', relation: 'Letter provided' },
      { id: 'climate', label: 'Climate Data', relation: 'Drought risk moderate' },
      { id: 'loans', label: 'Loans', relation: '1 outstanding' },
      { id: 'supplier', label: 'Input Supplier', relation: 'Receipts available' },
      { id: 'extension', label: 'Extension', relation: 'Last visit: 2023-09' },
    ],
  }), []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{farmer.fullName}</h1>
            <div className="text-sm text-muted-foreground">Farmer ID: {farmer.id}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Message</Button>
            <Button>Export Profile</Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Basic contact and demographic details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">National ID</div>
                    <div className="font-medium">{farmer.nationalId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{farmer.phone}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Gender</div>
                    <div className="font-medium">{farmer.gender}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Age</div>
                    <div className="font-medium">{farmer.age}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-medium">{[farmer.county, farmer.subCounty, farmer.ward, farmer.village].filter(Boolean).join(', ')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">GPS</div>
                    <div className="font-medium">{farmer.gps}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Farm History</CardTitle>
                <CardDescription>Recent crops and yields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {farmHistory.map((h) => (
                    <div key={h.year} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{h.year} — {h.crop}</div>
                        <div className="text-xs text-muted-foreground">Yield: {h.yield}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Report</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loan History</CardTitle>
                <CardDescription>Previous and active loans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {loanHistory.map((l) => (
                    <div key={l.date} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{l.product} — KES {l.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{l.date}</div>
                      </div>
                      <div className={cn('text-sm font-medium', l.status === 'Outstanding' ? 'text-amber-600' : 'text-green-600')}>{l.status}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assessment History</CardTitle>
                <CardDescription>Previous AI assessments and outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {assessments.map((a) => (
                    <div key={a.date} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{a.date} — Score: {a.score}</div>
                        <div className="text-xs text-muted-foreground">Decision: {a.decision}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">View</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Climate History</CardTitle>
                <CardDescription>Annual rainfall trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {climateHistory.map((c) => (
                    <div key={c.year} className="flex items-center justify-between">
                      <div className="text-sm">{c.year}</div>
                      <div className="text-sm font-medium">{c.rainfall} mm</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
                <CardDescription>Key events</CardDescription>
              </CardHeader>
              <CardContent>
                <MiniTimeline events={timeline} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Knowledge Graph Summary</CardTitle>
                <CardDescription>Top connected entities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {kgSummary.nodes.map((n) => (
                    <div key={n.id} className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted/40 text-muted-foreground"><Layers className="h-4 w-4" /></div>
                      <div>
                        <div className="text-sm font-medium">{n.label}</div>
                        <div className="text-xs text-muted-foreground">{n.relation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
