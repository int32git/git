'use client';

import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { withErrorBoundary } from '@/components/ui/error-boundary';

interface DeviceComplianceChartProps {
  compliantCount: number;
  nonCompliantCount: number;
  isLoading?: boolean;
}

function DeviceComplianceChartBase({ 
  compliantCount, 
  nonCompliantCount, 
  isLoading = false 
}: DeviceComplianceChartProps) {
  // Use memoized chart options to prevent unnecessary re-renders
  const options = useMemo<EChartsOption>(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['Compliant', 'Non-Compliant'],
      textStyle: {
        color: '#888'
      }
    },
    series: [
      {
        name: 'Device Compliance',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        label: {
          show: false
        },
        data: [
          { value: compliantCount, name: 'Compliant', itemStyle: { color: '#10b981' } },
          { value: nonCompliantCount, name: 'Non-Compliant', itemStyle: { color: '#ef4444' } }
        ]
      }
    ],
    color: ['#10b981', '#ef4444']
  }), [compliantCount, nonCompliantCount]);

  // Loading state when data is being fetched
  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <Skeleton className="h-full w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state when no data is available
  const totalDevices = compliantCount + nonCompliantCount;
  if (totalDevices === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Device Compliance</CardTitle>
          <CardDescription>
            No device compliance data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Device Compliance</CardTitle>
        <CardDescription>
          Distribution of compliant vs non-compliant devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          <ReactECharts 
            option={options} 
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }} // Canvas renderer is more efficient for this chart type
            notMerge={true} // Prevent partial updates that could cause flicker
            lazyUpdate={true} // Only update when necessary
          />
        </div>
        <div className="flex justify-between text-sm mt-2">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-muted-foreground">Compliant: {compliantCount}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
            <span className="text-muted-foreground">Non-compliant: {nonCompliantCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Wrap with error boundary for resilience
export const DeviceComplianceChart = withErrorBoundary(DeviceComplianceChartBase, {
  name: 'DeviceComplianceChart',
}); 