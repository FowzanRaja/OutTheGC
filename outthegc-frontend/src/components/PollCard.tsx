import type { Poll, Vote } from "../types/api";
import type { CSSProperties } from "react";

interface PollCardProps {
  poll: Poll;
  memberId: string;
  onVote: (pollId: string, optionId: string) => void;
  loading?: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  memberId,
  onVote,
  loading = false,
}) => {

  const hasVoted = poll.votes.some((v: Vote) => v.member_id === memberId);

  const handleVote = (optionId: string) => {
    onVote(poll.id, optionId);
  };

  const voteCounts = poll.options.map((opt) => {
    const optionId = typeof opt === 'string' ? opt : opt.id;
    return poll.votes.filter((v: Vote) => v.option_id === optionId).length;
  });
  const maxVotes = Math.max(...voteCounts);

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
      <h4 className="font-semibold text-slate-100 mb-3">{poll.question}</h4>
      <div className="space-y-2">
        {poll.options.map((option, idx) => {
          const optionId = typeof option === 'string' ? option : option.id;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const voteCount = voteCounts[idx];
          const percentage = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;
          const voters = poll.votes
            .filter((v: Vote) => v.option_id === optionId)
            .map((v: Vote) => v.member_name);

          return (
            <div key={optionId}>
              {poll.type === "single" ? (
                <button
                  type="button"
                  onClick={() => handleVote(optionId)}
                  disabled={hasVoted || loading}
                  className="flex w-full items-center gap-2 p-2 rounded hover:bg-slate-800/50 text-left"
                  aria-pressed={false}
                >
                  <span className="text-sm flex-1">{optionLabel}</span>
                  <span className="text-xs text-slate-400">{voteCount}</span>
                </button>
              ) : (
                <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    value={optionId}
                    disabled={hasVoted || loading}
                    onChange={() => handleVote(optionId)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm flex-1">{optionLabel}</span>
                  <span className="text-xs text-slate-400">{voteCount}</span>
                </label>
              )}
              {voteCount > 0 && (
                <div className="flex items-center gap-2 px-2 mt-1">
                  <div className="relative w-full otg-bar">
                    <div className="otg-bar-gradient" />
                    <div
                      className="otg-bar-mask"
                      style={{ left: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                  {voters.length > 0 && (
                    <span className="text-xs text-slate-500">
                      {voters.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hasVoted && (
        <p className="text-xs text-slate-400 mt-3">✓ You have voted</p>
      )}
    </div>
  );
};

interface SliderPollProps {
  poll: Poll;
  currentValue: number;
  onChange: (value: number) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isOpen?: boolean;
  loading?: boolean;
  hasVoted?: boolean;
}

export const SliderPoll: React.FC<SliderPollProps> = ({
  poll,
  currentValue,
  onChange,
  onSubmit,
  disabled = false,
  isOpen = false,
  loading = false,
  hasVoted = false,
}) => {
  const min = poll.slider?.min ?? 0;
  const max = poll.slider?.max ?? 100;
  const step = poll.slider?.step ?? 1;
  const value = Math.min(max, Math.max(min, currentValue));
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const votes = poll.votes
    .filter((v) => typeof v.value === "number")
    .map((v) => ({ member_name: v.member_name, value: v.value as number }));
  const average = votes.length > 0 ? votes.reduce((sum, v) => sum + v.value, 0) / votes.length : 0;
  const averagePercent = max > min ? ((average - min) / (max - min)) * 100 : 0;
  const averagePercentClamped = Math.min(100, Math.max(0, averagePercent));

  const trackStyle: CSSProperties = {
    background: `linear-gradient(to right,
      rgba(45, 212, 191, 0.85) 0%,
      rgba(168, 85, 247, 0.85) ${percent}%,
      rgba(0,0,0,0.25) ${percent}%,
      rgba(0,0,0,0.25) 100%)`,
  };

  return (
    <div className="w-full">
      <p className="text-lg font-semibold text-white mb-3">{poll.question}</p>

      <div className="relative w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full slider-outthegc"
          style={trackStyle}
          disabled={disabled}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="px-3 py-1 rounded-full bg-black/35 border border-white/10 text-white text-sm">
          {poll.slider?.left_label}
        </div>
        <div className="px-3 py-1 rounded-full bg-black/35 border border-white/10 text-white text-sm">
          {poll.slider?.right_label}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="relative w-full otg-bar">
          <div className="otg-bar-gradient" />
          <div
            className="otg-bar-mask"
            style={{ left: `${averagePercentClamped}%` }}
          />
          <div
            className="absolute top-1/2 h-[18px] w-[8px] -translate-y-1/2 -translate-x-1/2 rounded-md bg-white shadow-[0_6px_14px_rgba(0,0,0,0.35)] border border-white/30"
            style={{ left: `${averagePercentClamped}%` }}
            aria-label={`Average: ${average.toFixed(1)}`}
            title={`Average: ${average.toFixed(1)}`}
          />
        </div>
        {votes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-300">Responses:</p>
            <div className="flex flex-wrap gap-2">
              {votes.map((v, idx) => (
                <span
                  key={`${v.member_name}-${idx}`}
                  className="inline-flex items-center gap-1 text-xs bg-black/35 border border-white/10 text-white px-2 py-1 rounded-full"
                >
                  {v.member_name}: {v.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {isOpen && !hasVoted && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-500 hover:bg-indigo-400 text-white w-full"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Vote"}
          </button>
        </div>
      )}
    </div>
  );
};
