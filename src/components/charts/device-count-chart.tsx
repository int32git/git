'use client';

import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DeviceCountChartProps {
  totalCount: number;
  deviceIds: string[];
}

export function DeviceCountChart({ totalCount, deviceIds }: DeviceCountChartProps) {
  const [options, setOptions] = useState({});

  useEffect(() => {
    // Generate mock data for device types
    const deviceTypes = [
      { name: 'Windows', value: 0 },
      { name: 'macOS', value: 0 },
      { name: 'iOS', value: 0 },
      { name: 'Android', value: 0 },
      { name: 'Linux', value: 0 },
      { name: 'Other', value: 0 }
    ];
    
    // Distribute devices by type
    let remaining = totalCount;
    
    // Create a deterministic distribution based on deviceIds length
    const seed = deviceIds.length % 100;
    
    deviceTypes.forEach((type, index) => {
      if (index === deviceTypes.length - 1) {
        // Last type gets remaining
        type.value = remaining;
      } else {
        // Distribution with some randomness but affected by the seed
        const ratio = [0.45, 0.25, 0.15, 0.1, 0.05][index] || 0;
        const variance = 0.2; // Add some variance
        const adjustedRatio = Math.max(0, ratio + (((seed + index) % 10) / 10 - 0.5) * variance);
        type.value = Math.min(remaining, Math.round(totalCount * adjustedRatio));
        remaining -= type.value;
      }
    });
    
    setOptions({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: deviceTypes.map(type => type.name),
        textStyle: {
          color: '#888'
        }
      },
      series: [
        {
          name: 'Device Type',
          type: 'pie',
          radius: '75%',
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
          data: deviceTypes
        }
      ],
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6b7280']
    });
  }, [totalCount, deviceIds]);

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Device Distribution</CardTitle>
        <CardDescription>
          Breakdown of device types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="text-center text-sm mt-2">
          <span className="text-muted-foreground">Total Devices: {totalCount}</span>
        </div>
      </CardContent>
    </Card>
  );
} 