import { useState } from "react";

interface PackingListProps {
  items: string[];
  onToggle?: (item: string) => void;
}

export const PackingList: React.FC<PackingListProps> = ({ items, onToggle }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const handleToggle = (item: string) => {
    const updated = new Set(checkedItems);
    if (updated.has(item)) {
      updated.delete(item);
    } else {
      updated.add(item);
    }
    setCheckedItems(updated);
    if (onToggle) onToggle(item);
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <label
          key={idx}
          className="flex items-center gap-3 p-2 rounded hover:bg-slate-800/50 cursor-pointer"
        >
          <input
            type="checkbox"
            checked={checkedItems.has(item)}
            onChange={() => handleToggle(item)}
            className="w-4 h-4 rounded"
          />
          <span
            className={`text-sm ${
              checkedItems.has(item)
                ? "text-slate-500 line-through"
                : "text-slate-200"
            }`}
          >
            {item}
          </span>
        </label>
      ))}
    </div>
  );
};
