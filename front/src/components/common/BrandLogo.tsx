import React from 'react';
import { cn } from '../../lib/utils';

type BrandLogoProps = {
  className?: string;
  imgClassName?: string;
  alt?: string;
};

/** Logo oficial em /kinito.webp (front/public e public/). */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  imgClassName,
  alt = 'Kinito',
}) => (
  <div
    className={cn(
      'rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-sm shrink-0 flex items-center justify-center',
      className
    )}
  >
    <img
      src="/kinito.webp"
      alt={alt}
      className={cn('w-full h-full object-contain', imgClassName)}
    />
  </div>
);
