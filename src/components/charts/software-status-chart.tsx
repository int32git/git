'use client';

import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SoftwareStatusChartProps {
  monitored: number;
  outdated: number;
}

export function SoftwareStatusChart({ monitored, outdated }: SoftwareStatusChartProps) {
  const [options, setOptions] = useState({});

  useEffect(() => {
    // Generate mock data for software types
    const softwareTypes = ['OS', 'Office', 'Browsers', 'Security', 'Utilities', 'Other'];
    
    // Generate up-to-date and outdated distribution
    const upToDateData = [];
    const outdatedData = [];
    
    let totalOutdated = outdated;
    let remainingMonitored = monitored - outdated;
    
    for (let i = 0; i < softwareTypes.length; i++) {
      if (i === softwareTypes.length - 1) {
        // Last category gets remaining values
        outdatedData.push(totalOutdated);
        upToDateData.push(remainingMonitored);
      } else {
        const outdatedValue = Math.min(
          totalOutdated, 
          Math.round(Math.random() * (outdated / softwareTypes.length) * 1.5)
        );
        outdatedData.push(outdatedValue);
        totalOutdated -= outdatedValue;
        
        const upToDateValue = Math.min(
          remainingMonitored,
          Math.round(Math.random() * (remainingMonitored / softwareTypes.length) * 1.5)
        );
        upToDateData.push(upToDateValue);
        remainingMonitored -= upToDateValue;
      }
    }
    
    setOptions({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['Up-to-date', 'Outdated'],
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
      yAxis: {
        type: 'category',
        data: softwareTypes,
        axisLine: {
          lineStyle: {
            color: '#ccc'
          }
        },
        axisLabel: {
          color: '#888'
        }
      },
      series: [
        {
          name: 'Up-to-date',
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series'
          },
          data: upToDateData,
          itemStyle: {
            color: '#10b981'
          }
        },
        {
          name: 'Outdated',
          type: 'bar',
          stack: 'total',
          emphasis: {
            focus: 'series'
          },
          data: outdatedData,
          itemStyle: {
            color: '#f59e0b'
          }
        }
      ]
    });
  }, [monitored, outdated]);

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Software Status</CardTitle>
        <CardDescription>
          Distribution of software by update status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ReactECharts option={options} style={{ height: '100%', width: '100%' }} />
        </div>
        <div className="flex justify-between text-sm mt-2">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-muted-foreground">Up-to-date: {monitored - outdated}</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
            <span className="text-muted-foreground">Outdated: {outdated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 