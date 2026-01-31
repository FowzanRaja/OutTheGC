interface Cost {
  category?: string;
  amount?: number;
  description?: string;
}

interface CostBreakdownProps {
  costs: Cost[];
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({ costs }) => {
  const total = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  return (
    <div className="space-y-2">
      {costs.map((cost, idx) => (
        <div key={idx} className="flex justify-between items-start text-sm">
          <div className="flex-1">
            {cost.category && (
              <p className="font-medium text-slate-200">{cost.category}</p>
            )}
            {cost.description && (
              <p className="text-xs text-slate-500">{cost.description}</p>
            )}
          </div>
          <span className="text-slate-300 font-medium ml-2">
            ${(cost.amount || 0).toFixed(2)}
          </span>
        </div>
      ))}
      <div className="border-t border-slate-800 mt-3 pt-3 flex justify-between font-semibold text-slate-100">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
};
