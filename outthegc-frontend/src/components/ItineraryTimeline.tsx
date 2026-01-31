import { useState } from "react";
import type { ItineraryBlock } from "../types/api";

interface ItineraryTimelineProps {
  itinerary: ItineraryBlock[];
  onDislike?: (blockId: string) => void;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  itinerary,
  onDislike,
}) => {
  const [disliked, setDisliked] = useState<Set<string>>(new Set());

  const groupedByDay = itinerary.reduce(
    (acc, block) => {
      const day = block.day || "Day Unknown";
      if (!acc[day]) acc[day] = [];
      acc[day].push(block);
      return acc;
    },
    {} as Record<string, ItineraryBlock[]>
  );

  const handleDislike = (blockId: string) => {
    const updated = new Set(disliked);
    if (updated.has(blockId)) {
      updated.delete(blockId);
    } else {
      updated.add(blockId);
    }
    setDisliked(updated);
    if (onDislike) onDislike(blockId);
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDay).map(([day, blocks]) => (
        <div key={day}>
          <h5 className="text-sm font-semibold text-indigo-400 mb-3">{day}</h5>
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`border-l-2 pl-3 py-2 transition ${
                  disliked.has(block.id)
                    ? "border-rose-600 opacity-50"
                    : "border-indigo-600"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    {block.time && (
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {block.time}
                      </p>
                    )}
                    <p className="text-sm font-medium text-slate-100">
                      {block.title}
                    </p>
                    {block.description && (
                      <p className="text-xs text-slate-400 mt-1">
                        {block.description}
                      </p>
                    )}
                  </div>
                  {onDislike && (
                    <button
                      onClick={() => handleDislike(block.id)}
                      className={`text-xs px-2 py-1 rounded transition ${
                        disliked.has(block.id)
                          ? "bg-rose-900/50 text-rose-200"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {disliked.has(block.id) ? "✗" : "👎"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
