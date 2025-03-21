import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loading({ size = 'md', text, className }: LoadingProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {text && <span className="ml-2">{text}</span>}
    </div>
  );
}

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full min-h-[200px]">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
} 