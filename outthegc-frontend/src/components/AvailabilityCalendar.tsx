import { useState, useEffect } from "react";

interface AvailabilityCalendarProps {
  value: string[]; // YYYY-MM-DD format
  onChange: (dates: string[]) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  value,
  onChange,
}) => {
  const [dates, setDates] = useState<string[]>(value);

  useEffect(() => {
    setDates(value);
  }, [value]);

  const toggleDate = (date: string) => {
    const updated = dates.includes(date)
      ? dates.filter((d) => d !== date)
      : [...dates, date];
    setDates(updated);
    onChange(updated);
  };

  // Generate next 30 days
  const next30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  return (
    <div>
      <label className="block text-sm font-medium mb-3">Available Dates</label>
      <div className="grid grid-cols-4 gap-2">
        {next30Days.map((date) => {
          const d = new Date(date);
          const dayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const isSelected = dates.includes(date);

          return (
            <button
              key={date}
              onClick={() => toggleDate(date)}
              className={`p-2 rounded text-xs font-medium transition ${
                isSelected
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {dayStr}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {dates.length} date{dates.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
};
