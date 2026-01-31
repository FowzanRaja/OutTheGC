import type { Poll, Vote } from "../types/api";

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
                <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-800/50 cursor-pointer">
                  <input
                    type="radio"
                    name={poll.id}
                    value={optionId}
                    disabled={hasVoted || loading}
                    onChange={() => handleVote(optionId)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm flex-1">{optionLabel}</span>
                  <span className="text-xs text-slate-400">{voteCount}</span>
                </label>
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
                  <div
                    className="h-1.5 bg-indigo-600 rounded"
                    style={{ width: `${percentage}%` }}
                  />
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
