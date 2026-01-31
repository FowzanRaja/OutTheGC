import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { submitFeedback, rerunOptions } from "../api/options";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const Options: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { memberId, trip, isOrganiser, refresh } = useTrip();
  const navigate = useNavigate();
  
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feedback form state
  const [feedbackForms, setFeedbackForms] = useState<
    Record<
      string,
      {
        rating: number;
        disliked_activity_ids: string[];
        comment: string;
      }
    >
  >({});

  const options = trip?.latest_plan?.options || [];

  if (!trip || !options.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Trip Options</h1>
            <p className="text-slate-400">{trip?.trip.name}</p>
          </div>
          <Card>
            <p className="text-slate-400 text-center py-8">No options generated yet</p>
            {isOrganiser && (
              <Button
                variant="primary"
                onClick={() => navigate(`/trip/${tripId}/dashboard`)}
                className="mx-auto"
              >
                Generate Options from Dashboard
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  const initFeedbackForm = (optionId: string) => {
    if (!feedbackForms[optionId]) {
      setFeedbackForms({
        ...feedbackForms,
        [optionId]: {
          rating: 3,
          disliked_activity_ids: [],
          comment: "",
        },
      });
    }
  };

  const handleSubmitFeedback = async (optionId: string) => {
    if (!tripId || !memberId) return;

    setLoading(true);
    setError(null);

    try {
      const form = feedbackForms[optionId];
      await submitFeedback(tripId, optionId, {
        member_id: memberId,
        rating: form.rating,
        disliked_activity_ids: form.disliked_activity_ids,
        comment: form.comment || undefined,
      });
      refresh();
      // Clear form
      setFeedbackForms({
        ...feedbackForms,
        [optionId]: { rating: 3, disliked_activity_ids: [], comment: "" },
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = async () => {
    if (!tripId || !memberId) return;

    setLoading(true);
    setError(null);

    try {
      await rerunOptions(tripId, { created_by_member_id: memberId });
      refresh();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to rerun options");
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityDislike = (optionId: string, activityId: string) => {
    const form = feedbackForms[optionId];
    const isDisliked = form.disliked_activity_ids.includes(activityId);
    setFeedbackForms({
      ...feedbackForms,
      [optionId]: {
        ...form,
        disliked_activity_ids: isDisliked
          ? form.disliked_activity_ids.filter((id) => id !== activityId)
          : [...form.disliked_activity_ids, activityId],
      },
    });
  };

  const getTotalCost = (costs: Record<string, number>) => {
    return Object.values(costs).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Trip Options</h1>
            <p className="text-slate-400">{trip.trip.name}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleRerun}
              disabled={loading || !isOrganiser}
              title={!isOrganiser ? "Organiser only" : ""}
            >
              {loading ? "Rerunning..." : "Rerun Options"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/trip/${tripId}/dashboard`)}
            >
              Back
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-900/30 border border-rose-500 rounded text-rose-200">
            {error}
          </div>
        )}

        {/* Options Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {options.map((option, idx) => {
            const optionLetters = ["A", "B", "C"];
            const totalCost = getTotalCost(option.costs);
            const isExpanded = expandedOption === option.id;

            initFeedbackForm(option.id);
            const form = feedbackForms[option.id];

            return (
              <div key={option.id} className="flex flex-col">
                {/* Option Card */}
                <Card className="flex-1 cursor-pointer hover:border-slate-700 transition mb-4">
                  <div onClick={() => setExpandedOption(isExpanded ? null : option.id)}>
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-2xl font-bold">
                        Option {optionLetters[idx]}
                      </h2>
                      <Badge>{option.title}</Badge>
                    </div>
                    <p className="text-slate-300 font-semibold mb-1">
                      {option.destination}
                    </p>
                    <p className="text-sm text-slate-400 mb-4">{option.date_window}</p>

                    {/* Summary */}
                    <p className="text-sm text-slate-200 mb-4">{option.summary}</p>

                    {/* Cost Overview */}
                    <div className="bg-slate-800/50 p-3 rounded mb-4">
                      <p className="text-xs text-slate-400 mb-1">Estimated Total</p>
                      <p className="text-2xl font-bold text-indigo-400">
                        ${totalCost.toFixed(2)}
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      className="w-full text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedOption(isExpanded ? null : option.id);
                      }}
                    >
                      {isExpanded ? "Hide Details" : "View Details"}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-700 space-y-6">
                      {/* Itinerary */}
                      <div>
                        <h3 className="font-semibold mb-3">Itinerary</h3>
                        <div className="space-y-3">
                          {option.itinerary.map((block) => (
                            <div
                              key={block.id}
                              className="p-3 bg-slate-800/50 rounded border border-slate-700 cursor-pointer hover:border-slate-600 transition"
                              onClick={() =>
                                toggleActivityDislike(option.id, block.id)
                              }
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    Day {block.day} • {block.time}
                                  </p>
                                  <p className="text-sm text-slate-300">
                                    {block.title}
                                  </p>
                                  {block.description && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      {block.description}
                                    </p>
                                  )}
                                </div>
                                {form.disliked_activity_ids.includes(block.id) && (
                                  <span className="text-xs text-rose-400">✗</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div>
                        <h3 className="font-semibold mb-3">Cost Breakdown</h3>
                        <div className="space-y-2 bg-slate-800/50 p-3 rounded">
                          {Object.entries(option.costs).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-slate-300 capitalize">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="font-medium">${value.toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t border-slate-600 pt-2 mt-2 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>${totalCost.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Transport */}
                      {option.transport.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Transport</h3>
                          <div className="space-y-2">
                            {option.transport.map((t, idx) => (
                              <div key={idx} className="p-3 bg-slate-800/50 rounded">
                                <p className="font-medium text-sm capitalize">
                                  {t.mode}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {t.details}
                                </p>
                                {t.price_estimate && (
                                  <p className="text-xs text-indigo-400 mt-1">
                                    ~${t.price_estimate.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Packing List */}
                      {option.packing_list.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Packing List</h3>
                          <ul className="space-y-1 text-sm text-slate-300">
                            {option.packing_list.map((item, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-slate-500">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Rationale */}
                      <div>
                        <h3 className="font-semibold mb-2">Why This Option</h3>
                        <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded">
                          {option.rationale}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Feedback Form */}
                {!isExpanded && form && (
                  <Card>
                    <h3 className="font-semibold mb-4 text-sm">Your Feedback</h3>

                    {/* Rating */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium mb-2">
                        Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            onClick={() =>
                              setFeedbackForms({
                                ...feedbackForms,
                                [option.id]: { ...form, rating: r },
                              })
                            }
                            className={`w-8 h-8 rounded text-xs font-bold transition ${
                              form.rating >= r
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium mb-2">
                        Comment
                      </label>
                      <textarea
                        value={form.comment}
                        onChange={(e) =>
                          setFeedbackForms({
                            ...feedbackForms,
                            [option.id]: { ...form, comment: e.target.value },
                          })
                        }
                        placeholder="Any feedback..."
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-xs text-slate-100 focus:border-indigo-500 outline-none"
                        rows={2}
                      />
                    </div>

                    {/* Submit */}
                    <Button
                      variant="primary"
                      onClick={() => handleSubmitFeedback(option.id)}
                      disabled={loading}
                      className="w-full text-xs py-2"
                    >
                      {loading ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
