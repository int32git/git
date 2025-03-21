'use client';

import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DeviceComplianceChartProps {
  compliantCount: number;
  nonCompliantCount: number;
}

export function DeviceComplianceChart({ compliantCount, nonCompliantCount }: DeviceComplianceChartProps) {
  const [options, setOptions] = useState({});

  useEffect(() => {
    // Update chart options when data changes
    setOptions({
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
    });
  }, [compliantCount, nonCompliantCount]);

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
          <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
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