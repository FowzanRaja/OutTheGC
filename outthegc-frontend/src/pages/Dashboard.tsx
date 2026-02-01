import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { updateBrief, setRequiredAttendees } from "../api/trips";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const Dashboard: React.FC = () => {
  import { useEffect, useState } from "react";
  import { useParams, useNavigate } from "react-router-dom";
  import { useTrip } from "../context/TripContext";
  import { updateBrief } from "../api/trips";
  import { vote as submitVote } from "../api/polls";
  import { Card } from "../components/ui/Card";
  import { Button } from "../components/ui/Button";
  import { Badge } from "../components/ui/Badge";
  import { PollCard } from "../components/PollCard";

  export const Dashboard: React.FC = () => {
    const { tripId: routeId } = useParams<{ tripId: string }>();
    const { tripId, trip, isOrganiser, refresh, setTripId, memberId } = useTrip();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [briefText, setBriefText] = useState("");
    const [loading, setLoading] = useState(false);
    const [pollLoading, setPollLoading] = useState<string | null>(null);

    // Sync route trip ID with context
    useEffect(() => {
      if (routeId && routeId !== tripId) {
        setTripId(routeId);
      }
    }, [routeId, tripId, setTripId]);

    // Initialize form states (only when trip loads or not editing)
    useEffect(() => {
      if (trip && !editing) {
        setBriefText(trip.trip.brief || "");
      }
    }, [trip, editing]);

    // 2.5 second polling refresh
    useEffect(() => {
      const interval = setInterval(() => refresh(), 2500);
      return () => clearInterval(interval);
    }, [tripId, refresh]);

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

    const handleSaveBrief = async () => {
      setLoading(true);
      try {
        await updateBrief(trip.trip.id, briefText);
        setEditing(false);
        refresh();
      } catch (err: any) {
        console.error("Failed to update brief:", err);
      } finally {
        setLoading(false);
      }
    };

    const activePolls = trip.polls.filter((poll) => poll.is_open);

    const handleVote = async (pollId: string, optionId: string) => {
      if (!memberId) return;
      const poll = trip.polls.find((p) => p.id === pollId);
      if (!poll?.is_open) return;

      setPollLoading(pollId);
      try {
        await submitVote(pollId, { member_id: memberId, option_id: optionId });
        refresh();
      } catch (err: any) {
        console.error("Failed to vote:", err);
      } finally {
        setPollLoading(null);
      }
    };

    const handleMemberClick = (id: string) => {
      const canClick = isOrganiser || id === memberId;
      if (!canClick) return;
      // placeholder for future member modal
      console.log("Member clicked", id);
    };

    return (
      <div className="min-h-screen relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="relative z-10 px-4 py-10">
          {/* Brand Header */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-5xl font-bold">OutTheGC</h1>
            <p className="text-white/70 mt-2">
              For plans that never make it out the group chat.
            </p>
          </div>

          <div className="mx-auto max-w-6xl px-6 pb-16 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-8 self-start">
              <Card className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Members</h2>
                  <Button variant="secondary" className="text-xs px-3 py-1">
                    {isOrganiser ? "Manage members" : "Edit myself"}
                  </Button>
                </div>
                <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
                  {trip.members.map((m) => {
                    const canClick = isOrganiser || m.id === memberId;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleMemberClick(m.id)}
                        className={`rounded-xl p-3 bg-white/5 border border-white/10 transition ${
                          canClick
                            ? "cursor-pointer hover:bg-white/10"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <p className="font-medium">{m.name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</Badge>
                          <Badge>{m.has_submitted_constraints ? "Submitted" : "Pending"}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </aside>

            {/* Main Content */}
            <main>
              <div className="space-y-8">
                {/* Brief Editor */}
                <Card className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl shadow-xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold mb-3">Trip Brief</h2>
                      {editing && isOrganiser ? (
                        <div className="space-y-4">
                          <textarea
                            value={briefText}
                            onChange={(e) => setBriefText(e.target.value)}
                            placeholder="Add a description…"
                            className="w-full min-h-[180px] bg-slate-800/70 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100"
                          />
                          <div className="flex gap-2">
                            <Button variant="primary" onClick={handleSaveBrief} disabled={loading}>
                              Save
                            </Button>
                            <Button variant="secondary" onClick={() => setEditing(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-slate-300 ${trip.trip.brief ? "" : "italic text-slate-400"}`}>
                          {trip.trip.brief || "Add a description…"}
                        </p>
                      )}
                    </div>
                    {isOrganiser && (
                      <Button
                        variant="secondary"
                        onClick={() => setEditing(!editing)}
                        className="text-xs px-3 py-1"
                      >
                        {editing ? "Cancel" : "Edit Brief"}
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Polls */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Polls</h2>
                    <Button
                      variant="primary"
                      onClick={() => navigate(`/trip/${trip.trip.id}/polls`)}
                      disabled={!isOrganiser}
                      title={!isOrganiser ? "Organiser only" : ""}
                      className="text-xs px-3 py-1"
                    >
                      Create Poll
                    </Button>
                  </div>
                  {activePolls.length === 0 ? (
                    <Card className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl">
                      <p className="text-slate-400 text-center py-6">No active polls</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {activePolls.map((poll) => (
                        <Card
                          key={poll.id}
                          className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl"
                        >
                          <PollCard
                            poll={poll}
                            memberId={memberId ?? ""}
                            onVote={handleVote}
                            loading={pollLoading === poll.id}
                          />
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {/* Bottom Action */}
                <div className="flex justify-center">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/trip/${trip.trip.id}/options`)}
                    disabled={!isOrganiser}
                    title={!isOrganiser ? "Organiser only" : ""}
                    className="w-full sm:w-auto px-10 py-5 text-lg shadow-2xl hover:shadow-2xl"
                  >
                    Generate Trip
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  };
                </div>
