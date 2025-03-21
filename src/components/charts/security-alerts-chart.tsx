'use client';

import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SecurityAlertsChartProps {
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export function SecurityAlertsChart({ highCount, mediumCount, lowCount }: SecurityAlertsChartProps) {
  const [options, setOptions] = useState({});

  useEffect(() => {
    // Generate mock data for the past 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Generate random data trends based on current counts
    const highData = generateTrendData(highCount);
    const mediumData = generateTrendData(mediumCount);
    const lowData = generateTrendData(lowCount);
    
    setOptions({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['High', 'Medium', 'Low'],
        bottom: 0,
        textStyle: {
          color: '#888'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: days,
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisLabel: {
          color: '#888'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisLabel: {
          color: '#888'
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0,0,0,0.05)'
          }
        }
      },
      series: [
        {
          name: 'High',
          type: 'line',
          stack: 'Total',
          data: highData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#ef4444'
          }
        },
        {
          name: 'Medium',
          type: 'line',
          stack: 'Total',
          data: mediumData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#f59e0b'
          }
        },
        {
          name: 'Low',
          type: 'line',
          stack: 'Total',
          data: lowData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3
          },
          itemStyle: {
            color: '#3b82f6'
          }
        }
      ],
      color: ['#ef4444', '#f59e0b', '#3b82f6']
    });
  }, [highCount, mediumCount, lowCount]);

  // Function to generate trend data with the last value being the current count
  const generateTrendData = (endValue: number) => {
    const variance = endValue * 0.3; // 30% variance
    return Array.from({ length: 7 }, (_, i) => {
      if (i === 6) return endValue;
      return Math.max(0, Math.round(endValue - variance + Math.random() * variance * 2));
    });
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Security Alerts Trend</CardTitle>
        <CardDescription>
          7-day history of security alerts by severity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
        </div>
      </CardContent>
    </Card>
  );
} 