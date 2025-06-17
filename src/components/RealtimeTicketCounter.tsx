
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeTicketCounterProps {
  totalTickets: number;
  ticketsSold: number;
  className?: string;
}

const RealtimeTicketCounter = ({ totalTickets, ticketsSold, className }: RealtimeTicketCounterProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [previousCount, setPreviousCount] = useState(ticketsSold);
  
  const availableTickets = totalTickets - ticketsSold;
  const soldOutPercentage = (ticketsSold / totalTickets) * 100;
  
  useEffect(() => {
    if (ticketsSold !== previousCount) {
      setIsUpdating(true);
      setPreviousCount(ticketsSold);
      
      // Reset animation after a short delay
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [ticketsSold, previousCount]);
  
  const getStatusVariant = () => {
    if (availableTickets === 0) return 'destructive';
    if (availableTickets <= 5) return 'secondary';
    return 'default';
  };
  
  const getStatusIcon = () => {
    if (availableTickets === 0) return <AlertTriangle className="w-3 h-3" />;
    if (availableTickets <= 5) return <AlertTriangle className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };
  
  const getStatusText = () => {
    if (availableTickets === 0) return 'SOLD OUT';
    if (availableTickets <= 5) return `${availableTickets} LEFT`;
    return `${availableTickets} AVAILABLE`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {ticketsSold} / {totalTickets} sold
        </span>
      </div>
      
      <Badge 
        variant={getStatusVariant()}
        className={cn(
          'transition-all duration-500 flex items-center gap-1',
          isUpdating && 'animate-pulse scale-105'
        )}
      >
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      
      {/* Progress bar */}
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-700 ease-out',
            soldOutPercentage >= 80 ? 'bg-red-500' : 
            soldOutPercentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${Math.min(soldOutPercentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default RealtimeTicketCounter;
