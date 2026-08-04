import React from 'react';
import { cn } from '../../lib/utils';

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Narrower reading width for forms/settings */
  narrow?: boolean;
};

/** Full-width page shell inside the app main area; keeps content from collapsing left. */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  narrow = false,
}) => (
  <div
    className={cn(
      'w-full min-w-0 mx-auto space-y-6 pb-12 animate-in fade-in duration-300',
      narrow ? 'max-w-5xl' : 'max-w-[1600px]',
      className
    )}
  >
    {children}
  </div>
);
