import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { vote as submitVote, createPoll } from "../api/polls";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { SliderPoll } from "../components/PollCard";

export const Polls: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { memberId, trip, refresh, isOrganiser } = useTrip();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [multiVotes, setMultiVotes] = useState<Record<string, Set<string>>>({});
  const [singleVoteSelection, setSingleVoteSelection] = useState<Record<string, string>>({});
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pollForm, setPollForm] = useState({
    question: "",
    type: "single" as "single" | "multi" | "slider",
    options: ["", ""],
    leftLabel: "",
    rightLabel: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (!trip) return;
    const defaults: Record<string, number> = {};
    trip.polls.forEach((poll) => {
      if (poll.type !== "slider") return;
      if (sliderValues[poll.id] !== undefined) return;
      const min = poll.slider?.min ?? 0;
      const max = poll.slider?.max ?? 100;
      defaults[poll.id] = Math.round((min + max) / 2);
    });
    if (Object.keys(defaults).length > 0) {
      setSliderValues((prev) => ({ ...prev, ...defaults }));
    }
  }, [trip, sliderValues]);

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
    if (!memberId || !tripId) return;

    setLoading(pollId);
    setError(null);

    try {
      await submitVote(tripId, pollId, { member_id: memberId, option_id: optionId });
      setUserVotes({ ...userVotes, [pollId]: optionId });
      setSingleVoteSelection({ ...singleVoteSelection, [pollId]: "" });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to vote");
    } finally {
      setLoading(null);
    }
  };

  const handleSliderVote = async (pollId: string) => {
    if (!memberId || !tripId) return;
    const value = sliderValues[pollId];
    if (value === undefined) {
      setError("Please select a value");
      return;
    }

    setLoading(pollId);
    setError(null);

    try {
      await submitVote(tripId, pollId, { member_id: memberId, value });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to vote");
    } finally {
      setLoading(null);
    }
  };

  const handleSingleVoteSelection = (pollId: string, optionId: string) => {
    setSingleVoteSelection({ ...singleVoteSelection, [pollId]: optionId });
  };

  const handleSubmitSingleVote = async (pollId: string) => {
    if (!memberId) return;

    const optionId = singleVoteSelection[pollId];
    if (!optionId) {
      setError("Please select an option");
      return;
    }

    await handleVote(pollId, optionId);
  };

  const handleMultiVoteToggle = (pollId: string, optionId: string) => {
    const current = multiVotes[pollId] || new Set();
    const updated = new Set(current);
    if (updated.has(optionId)) {
      updated.delete(optionId);
    } else {
      updated.add(optionId);
    }
    setMultiVotes({ ...multiVotes, [pollId]: updated });
  };

  const handleSubmitMultiVotes = async (pollId: string) => {
    if (!memberId || !tripId) return;

    const optionIds = multiVotes[pollId];
    if (!optionIds || optionIds.size === 0) {
      setError("Please select at least one option");
      return;
    }

    setLoading(pollId);
    setError(null);

    try {
      // Submit all selected options
      for (const optionId of optionIds) {
        await submitVote(tripId, pollId, { member_id: memberId, option_id: optionId });
      }
      setMultiVotes({ ...multiVotes, [pollId]: new Set() });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to vote");
    } finally {
      setLoading(null);
    }
  };

  const handleCreatePoll = async () => {
    if (!memberId || !trip) return;
    
    // Validation
    if (!pollForm.question.trim()) {
      setError("Question is required");
      return;
    }
    
    const isSlider = pollForm.type === "slider";
    const nonEmptyOptions = pollForm.options.filter(opt => opt.trim());
    if (!isSlider && nonEmptyOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }
    if (isSlider && (!pollForm.leftLabel.trim() || !pollForm.rightLabel.trim())) {
      setError("Left and right labels are required");
      return;
    }

    setCreateLoading(true);
    setError(null);

    try {
      if (isSlider) {
        await createPoll(trip.trip.id, {
          created_by_member_id: memberId,
          type: "slider",
          question: pollForm.question,
          slider: {
            left_label: pollForm.leftLabel.trim(),
            right_label: pollForm.rightLabel.trim(),
          },
        });
      } else {
        await createPoll(trip.trip.id, {
          created_by_member_id: memberId,
          type: pollForm.type,
          question: pollForm.question,
          options: nonEmptyOptions.map(label => ({ label })),
        });
      }
      
      // Reset form
      setPollForm({ question: "", type: "single", options: ["", ""], leftLabel: "", rightLabel: "" });
      setShowCreateForm(false);
      
      // Wait for refresh to complete before proceeding
      await refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create poll");
    } finally {
      setCreateLoading(false);
    }
  };

  const addOption = () => {
    setPollForm({ ...pollForm, options: [...pollForm.options, ""] });
  };

  const removeOption = (index: number) => {
    setPollForm({
      ...pollForm,
      options: pollForm.options.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...pollForm.options];
    newOptions[index] = value;
    setPollForm({ ...pollForm, options: newOptions });
  };

  const getVoteCount = (pollId: string, optionId: string): number => {
    const poll = trip.polls.find((p) => p.id === pollId);
    if (!poll) return 0;
    return poll.votes.filter((v) => v.option_id === optionId).length;
  };

  const getOptionVoterCount = (pollId: string, optionId: string): number => {
    const poll = trip.polls.find((p) => p.id === pollId);
    if (!poll) return 0;
    const uniqueVoters = new Set(
      poll.votes.filter((v) => v.option_id === optionId).map((v) => v.member_id)
    );
    return uniqueVoters.size;
  };

  const getTotalVoters = (pollId: string): number => {
    const poll = trip.polls.find((p) => p.id === pollId);
    if (!poll) return 0;
    const uniqueVoters = new Set(poll.votes.map((v) => v.member_id));
    return uniqueVoters.size;
  };

  const getTotalVotes = (pollId: string): number => {
    const poll = trip.polls.find((p) => p.id === pollId);
    if (!poll) return 0;
    if (poll.type === "multi") {
      return getTotalVoters(pollId);
    }
    return poll.votes.length;
  };

  const getVotersForOption = (pollId: string, optionId: string) => {
    const poll = trip.polls.find((p) => p.id === pollId);
    if (!poll) return [] as string[];
    return poll.votes
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
          <div className="flex gap-3">
            {isOrganiser && (
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="text-sm"
              >
                {showCreateForm ? "Cancel" : "Create Poll"}
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate(`/trip/${tripId}/dashboard`)}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-900/30 border border-rose-500 rounded text-rose-200">
            {error}
          </div>
        )}

        {/* Create Poll Form */}
        {showCreateForm && isOrganiser && (
          <Card className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Create New Poll</h2>
            <div className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <Textarea
                  value={pollForm.question}
                  onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                  placeholder="What would you like to ask?"
                  className="w-full"
                  rows={2}
                />
              </div>

              {/* Poll Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Poll Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pollType"
                      value="single"
                      checked={pollForm.type === "single"}
                      onChange={() => setPollForm({ ...pollForm, type: "single" })}
                      className="w-4 h-4"
                    />
                    <span>Single Choice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pollType"
                      value="multi"
                      checked={pollForm.type === "multi"}
                      onChange={() => setPollForm({ ...pollForm, type: "multi" })}
                      className="w-4 h-4"
                    />
                    <span>Multiple Choice</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pollType"
                      value="slider"
                      checked={pollForm.type === "slider"}
                      onChange={() => setPollForm({ ...pollForm, type: "slider" })}
                      className="w-4 h-4"
                    />
                    <span>Preference Slider</span>
                  </label>
                </div>
              </div>

              {pollForm.type === "slider" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-2">Left label</label>
                    <Input
                      value={pollForm.leftLabel}
                      onChange={(e) => setPollForm({ ...pollForm, leftLabel: e.target.value })}
                      placeholder="e.g. Relaxed"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Right label</label>
                    <Input
                      value={pollForm.rightLabel}
                      onChange={(e) => setPollForm({ ...pollForm, rightLabel: e.target.value })}
                      placeholder="e.g. Adventurous"
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Options</label>
                  <div className="space-y-2">
                    {pollForm.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1"
                        />
                        {pollForm.options.length > 2 && (
                          <Button
                            variant="secondary"
                            onClick={() => removeOption(index)}
                            className="px-3 py-2 text-sm"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={addOption}
                    className="mt-3 text-sm w-full"
                  >
                    + Add Option
                  </Button>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={handleCreatePoll}
                  disabled={createLoading}
                  className="flex-1"
                >
                  {createLoading ? "Creating..." : "Create Poll"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
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
              const memberVoteCount = poll.votes.filter((v) => v.member_id === memberId).length;
              const selectedOptions = multiVotes[poll.id] || new Set();

              return (
                <Card key={poll.id}>
                  {poll.type === "slider" ? (
                    <SliderPoll
                      poll={poll}
                      currentValue={sliderValues[poll.id] ?? 50}
                      onChange={(value) => setSliderValues({ ...sliderValues, [poll.id]: value })}
                      onSubmit={() => handleSliderVote(poll.id)}
                      disabled={!poll.is_open || userHasVoted}
                      isOpen={poll.is_open}
                      loading={loading === poll.id}
                      hasVoted={userHasVoted}
                    />
                  ) : (
                    <>
                      {/* Poll Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-xl font-semibold">{poll.question}</h2>
                          <div className="flex gap-2 mt-2">
                            <Badge>{poll.type === "single" ? "Single Choice" : "Multiple Choice"}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-4">
                        {poll.options.map((option) => {
                          const voteCount = poll.type === "multi"
                            ? getOptionVoterCount(poll.id, option.id)
                            : getVoteCount(poll.id, option.id);
                          const totalVoters = poll.type === "multi" ? getTotalVoters(poll.id) : totalVotes;
                          const percentage = totalVoters > 0 ? (voteCount / totalVoters) * 100 : 0;
                          const voters = getVotersForOption(poll.id, option.id);
                          const isUserVote = userVotes[poll.id] === option.id;
                          const isUserMultiVote = selectedOptions.has(option.id);
                          const isSelected = singleVoteSelection[poll.id] === option.id;

                          const isSingleClickable = poll.type === "single" && poll.is_open && !userHasVoted;

                          return (
                            <div
                              key={option.id}
                              className={`border border-slate-800 rounded-lg p-4 ${isSingleClickable ? "cursor-pointer hover:bg-slate-800/30" : ""}`}
                              onClick={() => {
                                if (isSingleClickable) {
                                  handleSingleVoteSelection(poll.id, option.id);
                                }
                              }}
                            >
                              {/* Option Label */}
                              <div className="flex justify-between items-center mb-3">
                                {poll.type === "multi" ? (
                                  <div className="flex items-center gap-2">
                                    {poll.is_open && !userHasVoted && (
                                      <input
                                        type="checkbox"
                                        checked={isUserMultiVote}
                                        onChange={() => handleMultiVoteToggle(poll.id, option.id)}
                                        className="w-4 h-4"
                                      />
                                    )}
                                    <span className="font-medium">{option.label}</span>
                                  </div>
                                ) : (
                                  <div className="flex-1 text-left font-medium">
                                    {option.label}
                                  </div>
                                )}
                                <span className="text-xs text-slate-400">
                                  {voteCount} vote{voteCount !== 1 ? "s" : ""}
                                </span>
                              </div>

                              {/* Vote Bar */}
                              <div className="w-full otg-bar mb-3">
                                <div className="otg-bar-gradient" />
                                <div
                                  className="otg-bar-mask"
                                  style={{ left: `${Math.min(100, Math.max(0, percentage))}%` }}
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

                              {((userHasVoted && isUserVote) || (!userHasVoted && isSelected)) && poll.type === "single" && (
                                <div className="text-xs text-indigo-400 font-medium">✓ Your vote</div>
                              )}

                              {userHasVoted && isUserMultiVote && poll.type === "multi" && (
                                <div className="text-xs text-indigo-400 font-medium">✓ Selected</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {poll.type !== "slider" && (
                    <>
                      {/* Submit Button for Single Choice */}
                      {poll.is_open && !userHasVoted && poll.type === "single" && (
                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <Button
                            variant="primary"
                            onClick={() => handleSubmitSingleVote(poll.id)}
                            disabled={loading === poll.id || !singleVoteSelection[poll.id]}
                            className="w-full"
                          >
                            {loading === poll.id ? "Submitting..." : "Submit Vote"}
                          </Button>
                        </div>
                      )}

                      {/* Submit Button for Multi Choice */}
                      {poll.is_open && !userHasVoted && poll.type === "multi" && (
                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <Button
                            variant="primary"
                            onClick={() => handleSubmitMultiVotes(poll.id)}
                            disabled={loading === poll.id || selectedOptions.size === 0}
                            className="w-full"
                          >
                            {loading === poll.id ? "Submitting..." : `Submit Votes (${selectedOptions.size} selected)`}
                          </Button>
                        </div>
                      )}

                      {/* Poll Stats */}
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-xs text-slate-400">
                          {poll.is_open ? "Poll is open" : "Poll is closed"} •{" "}
                          {totalVotes} vote{totalVotes !== 1 ? "s" : ""} total
                          {userHasVoted && ` • You voted (${memberVoteCount})`}
                        </p>
                      </div>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
