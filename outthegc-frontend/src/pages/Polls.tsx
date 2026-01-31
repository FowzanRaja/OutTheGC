import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { vote as submitVote } from "../api/polls";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const Polls: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { memberId, trip, refresh } = useTrip();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  if (!trip) {
    return (
      <div className="min-h-screen relative overflow-hidden text-white flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="relative z-10">Loading...</div>
      </div>
    );
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (!memberId) return;

    setLoading(pollId);
    setError(null);

    try {
      await submitVote(pollId, { member_id: memberId, option_id: optionId });
      setUserVotes({ ...userVotes, [pollId]: optionId });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to vote");
    } finally {
      setLoading(null);
    }
  };

  const getVoteCount = (optionId: string): number => {
    return trip.polls.flatMap((p) => p.votes).filter((v) => v.option_id === optionId).length;
  };

  const getTotalVotes = (pollId: string): number => {
    const poll = trip.polls.find((p) => p.id === pollId);
    return poll?.votes.length || 0;
  };

  const getVotersForOption = (optionId: string) => {
    return trip.polls
      .flatMap((p) => p.votes)
      .filter((v) => v.option_id === optionId)
      .map((v) => v.member_name);
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Polls</h1>
            <p className="text-white/70">{trip.trip.name}</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(`/trip/${tripId}/dashboard`)}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-900/30 border border-rose-500 rounded text-rose-200">
            {error}
          </div>
        )}

        {trip.polls.length === 0 ? (
          <Card>
            <p className="text-slate-400 text-center py-8">No polls yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {trip.polls.map((poll) => {
              const totalVotes = getTotalVotes(poll.id);
              const userHasVoted = poll.votes.some((v) => v.member_id === memberId);

              return (
                <Card key={poll.id}>
                  {/* Poll Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{poll.question}</h2>
                      <div className="flex gap-2 mt-2">
                        <Badge>{poll.type === "single" ? "Single Choice" : "Multiple Choice"}</Badge>
                        {poll.is_open ? <Badge>Open</Badge> : <Badge>Closed</Badge>}
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    {poll.options.map((option) => {
                      const voteCount = getVoteCount(option.id);
                      const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                      const voters = getVotersForOption(option.id);
                      const isUserVote = userVotes[poll.id] === option.id;

                      return (
                        <div key={option.id} className="border border-slate-800 rounded-lg p-4">
                          {/* Option Label */}
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-slate-400">
                              {voteCount} vote{voteCount !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Vote Bar */}
                          <div className="w-full bg-slate-800 rounded h-2 mb-3 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isUserVote
                                  ? "bg-indigo-500"
                                  : "bg-slate-600"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {/* Voters List */}
                          {voters.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-slate-400 mb-1">Voted:</p>
                              <div className="flex flex-wrap gap-1">
                                {voters.map((name, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block text-xs bg-slate-800 px-2 py-1 rounded"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Vote Button */}
                          {poll.is_open && !userHasVoted && (
                            <Button
                              variant="primary"
                              onClick={() => handleVote(poll.id, option.id)}
                              disabled={loading === poll.id}
                              className="w-full text-sm py-2"
                            >
                              {loading === poll.id ? "Voting..." : "Vote"}
                            </Button>
                          )}

                          {userHasVoted && isUserVote && (
                            <div className="text-xs text-indigo-400 font-medium">✓ Your vote</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Poll Stats */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-400">
                      {poll.is_open ? "Poll is open" : "Poll is closed"} •{" "}
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""} total
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
