import { useState } from "react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ItineraryTimeline } from "./ItineraryTimeline";
import { PackingList } from "./PackingList";
import type { Option } from "../types/api";

interface OptionCardProps {
  option: Option;
  onFeedbackClick?: () => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  option,
  onFeedbackClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  const totalCost = Object.entries(option.costs)
    .reduce((sum: number, [_, amount]) => sum + (amount || 0), 0)
    .toFixed(2);

  return (
    <Card className="flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100">{option.title}</h3>
          <p className="text-sm text-slate-400">{option.destination}</p>
          <p className="text-xs text-slate-500 mt-1">{option.date_window}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-indigo-400">${totalCost}</p>
        </div>
      </div>

      {option.summary && (
        <p className="text-sm text-slate-300 mb-3 line-clamp-2">
          {option.summary}
        </p>
      )}

      <Button
        variant={expanded ? "primary" : "secondary"}
        onClick={() => setExpanded(!expanded)}
        className="w-full"
      >
        {expanded ? "Hide Details" : "Show Details"}
      </Button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
          {option.itinerary && option.itinerary.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-slate-200">Itinerary</h4>
              <ItineraryTimeline itinerary={option.itinerary} />
            </>
          )}

          {option.costs && option.costs.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-slate-200">Costs</h4>
              <div className="space-y-2">
                {Object.entries(option.costs).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-start text-sm">
                    <span className="font-medium text-slate-200">{category}</span>
                    <span className="text-slate-300 font-medium">${(amount || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-slate-800 mt-3 pt-3 flex justify-between font-semibold text-slate-100">
                  <span>Total</span>
                  <span>${totalCost}</span>
                </div>
              </div>
            </>
          )}

          {option.transport && (
            <>
              <h4 className="text-sm font-semibold text-slate-200">Transport</h4>
              <div className="space-y-2">
                {Array.isArray(option.transport) && option.transport.map((t, idx) => (
                  <div key={idx} className="text-sm text-slate-400">
                    <p className="font-medium text-slate-200">{t.mode}</p>
                    <p className="text-xs">{t.details}</p>
                    {t.price_estimate && (
                      <p className="text-xs text-indigo-400">${t.price_estimate.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {option.packing_list && option.packing_list.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-slate-200">Packing List</h4>
              <PackingList items={option.packing_list} />
            </>
          )}

          {option.rationale && (
            <>
              <h4 className="text-sm font-semibold text-slate-200">Why This Option?</h4>
              <p className="text-sm text-slate-400">{option.rationale}</p>
            </>
          )}

          {onFeedbackClick && (
            <Button
              variant="secondary"
              onClick={onFeedbackClick}
              className="w-full"
            >
              Leave Feedback
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
