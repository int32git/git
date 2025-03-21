"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { FileText, Lock, BarChart2, PieChart, LineChart, Table, Calendar, DownloadCloud } from "lucide-react"

export function PremiumReportPreview() {
  return (
    <Card className="mt-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <FileText className="mr-2 h-5 w-5 text-primary" />
          Premium Reporting Preview
        </CardTitle>
        <CardDescription>
          Upgrade to access advanced reporting features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Report preview mockup */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <BarChart2 className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-medium">Device Compliance Report</h3>
                </div>
                <span className="text-xs text-muted-foreground">Monthly</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1 bg-muted h-16 rounded flex items-center justify-center">
                  <PieChart className="h-8 w-8 text-muted-foreground/70" />
                </div>
                <div className="col-span-3">
                  <div className="h-3 bg-muted rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-muted rounded mb-2 w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <LineChart className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-medium">Security Alerts Trend</h3>
                </div>
                <span className="text-xs text-muted-foreground">Weekly</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <div className="h-3 bg-muted rounded mb-2 w-full"></div>
                  <div className="h-3 bg-muted rounded mb-2 w-4/5"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
                <div className="col-span-1 bg-muted h-16 rounded flex items-center justify-center">
                  <Table className="h-8 w-8 text-muted-foreground/70" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Premium features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-lg flex flex-col items-center text-center">
              <FileText className="h-8 w-8 text-primary mb-2 opacity-70" />
              <h3 className="text-sm font-medium mb-1">Custom Reports</h3>
              <p className="text-xs text-muted-foreground">Create custom reports with drag-and-drop builder</p>
            </div>
            <div className="p-4 bg-muted rounded-lg flex flex-col items-center text-center">
              <Calendar className="h-8 w-8 text-primary mb-2 opacity-70" />
              <h3 className="text-sm font-medium mb-1">Scheduled Reports</h3>
              <p className="text-xs text-muted-foreground">Automate report generation and distribution</p>
            </div>
            <div className="p-4 bg-muted rounded-lg flex flex-col items-center text-center">
              <DownloadCloud className="h-8 w-8 text-primary mb-2 opacity-70" />
              <h3 className="text-sm font-medium mb-1">Multiple Formats</h3>
              <p className="text-xs text-muted-foreground">Export reports in PDF, Excel, CSV formats</p>
            </div>
          </div>
          
          {/* Premium overlay */}
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-lg">
            <Lock className="h-10 w-10 text-primary mb-3" />
            <p className="text-center mb-4 text-sm">
              <span className="font-medium">Premium Feature</span><br />
              <span className="text-muted-foreground">Upgrade to access full reporting capabilities</span>
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/pricing">Upgrade Now</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/reporting">Try Preview</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 