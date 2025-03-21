'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeviceIdViewerProps {
  deviceIds: string[];
  maxDisplayCount?: number;
}

export function DeviceIdViewer({ deviceIds, maxDisplayCount = 100 }: DeviceIdViewerProps) {
  const [open, setOpen] = useState(false);
  
  // Limit the number of IDs to display to avoid performance issues
  const displayIds = deviceIds.slice(0, maxDisplayCount);
  const hasMore = deviceIds.length > maxDisplayCount;
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setOpen(true)}
        className="w-full mt-2"
      >
        View Device IDs
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Device IDs</DialogTitle>
            <DialogDescription>
              {deviceIds.length} unique device IDs loaded from Microsoft API
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-1">
              {displayIds.map((id, index) => (
                <div 
                  key={id} 
                  className="text-sm font-mono p-1 border-b border-muted-foreground/20 flex justify-between items-center"
                >
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="ml-2">{id}</span>
                </div>
              ))}
              {hasMore && (
                <div className="text-center p-2 text-muted-foreground text-sm">
                  ...and {deviceIds.length - maxDisplayCount} more
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 