import { ReactNode } from 'react';
import { cn } from './utils';

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export function ScrollArea({ children, className }: ScrollAreaProps) {
  return (
    <div className={cn("overflow-auto", className)}>
      {children}
    </div>
  );
}
