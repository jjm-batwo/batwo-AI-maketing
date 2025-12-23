import * as React from 'react';

import { cn } from '../lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string;
  description?: string;
  action?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, heading, description, action, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center justify-between space-y-2', className)} {...props}>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
          {description && <p className="text-lg text-muted-foreground">{description}</p>}
          {children}
        </div>
        {action && <div className="flex items-center space-x-2">{action}</div>}
      </div>
    );
  }
);
PageHeader.displayName = 'PageHeader';

export { PageHeader };
