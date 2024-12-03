import { Calendar, HandCoins, AlertCircle } from 'lucide-react';
import { formatDateRange } from '@/lib/date-utils';

export function PlanHeader({ data }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{data.destination}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{data.dailyPlans.length} Days • {formatDateRange(data.dailyPlans)}</span>
            </div>
            <div className="flex items-center gap-2">
              <HandCoins className="w-4 h-4" />
              <span>Estimated Budget: {data.totalCost}</span>
            </div>
          </div>
        </div>
      </div>

      {data.generalNotes && (
        <div className="max-w-max rounded-md bg-gray-50 p-3">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Travel Tips</h3>
              <p className="text-sm text-gray-600">{data.generalNotes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}