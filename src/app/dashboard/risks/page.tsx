'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Page() {
  const { userAccess } = useAuth();
  const isPremium = userAccess?.role === 'premium_user';
  const [dashboardData, setDashboardData] = React.useState({
    risks: { high: 0, medium: 0, low: 0 },
  });

  // Load dashboard data from localStorage on component mount
  React.useEffect(() => {
    const cachedData = localStorage.getItem('dashboard_data');
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        setDashboardData(parsedData);
      } catch (error) {
        console.error('Error parsing cached data:', error);
      }
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Risk Management</h1>
      
      {isPremium && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold">Security Risks</h2>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Risks</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.risks.high + dashboardData.risks.medium + dashboardData.risks.low}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500">{dashboardData.risks.high} high</span> / 
                <span className="text-amber-500"> {dashboardData.risks.medium} medium</span> / 
                <span className="text-green-500"> {dashboardData.risks.low} low</span>
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold">Risk Dashboard</h2>
        <p>Overview of potential risks categorized by severity.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">Incident Reporting</h2>
        <p>Users can report issues with risk assessments.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">Threat Detection & Alerts</h2>
        <p>Integration with security tools to flag anomalies.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">Mitigation Plans</h2>
        <p>Define risk response strategies.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">Compliance Reports</h2>
        <p>Check adherence to industry regulations.</p>
      </section>
    </div>
  );
}
