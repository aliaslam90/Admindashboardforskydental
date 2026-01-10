import { Badge } from './ui/badge';
import { AppointmentStatus } from '../data/types';

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<AppointmentStatus, { label: string; className: string }> = {
    booked: {
      label: 'Booked',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    },
    confirmed: {
      label: 'Confirmed',
      className: 'bg-green-100 text-green-700 hover:bg-green-100'
    },
    'checked-in': {
      label: 'Checked In',
      className: 'bg-purple-100 text-purple-700 hover:bg-purple-100'
    },
    completed: {
      label: 'Completed',
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700 hover:bg-red-100'
    },
    'no-show': {
      label: 'No-show',
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    }
  };

  const config = variants[status];

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
