import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { updateBrief, setRequiredAttendees } from "../api/trips";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

export const Dashboard: React.FC = () => {
  const { tripId: routeId } = useParams<{ tripId: string }>();
  const { tripId, trip, isOrganiser, refresh, setTripId } = useTrip();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [briefText, setBriefText] = useState("");
  const [selectedRequired, setSelectedRequired] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
      setSelectedRequired(trip.trip.required_member_ids || []);
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

  const handleSaveRequired = async () => {
    setLoading(true);
    try {
      await setRequiredAttendees(trip.trip.id, selectedRequired);
      refresh();
    } catch (err: any) {
      console.error("Failed to update required attendees:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRequired = (memberId: string) => {
    setSelectedRequired((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{trip.trip.name}</h1>
          <p className="text-white/70">{trip.trip.origin}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Trip Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Brief */}
            <Card>
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold">Trip Brief</h2>
                <Button
                  variant="secondary"
                  onClick={() => setEditing(!editing)}
                  disabled={!isOrganiser}
                  title={!isOrganiser ? "Organiser only" : ""}
                  className="text-xs px-3 py-1"
                >
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <textarea
                    value={briefText}
                    onChange={(e) => setBriefText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                    rows={3}
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
                <p className="text-slate-300">{trip.trip.brief || "No brief provided"}</p>
              )}
            </Card>

            {/* Members */}
            <Card>
              <h2 className="text-lg font-semibold mb-4">Members</h2>
              <div className="space-y-2">
                {trip.members.map((m) => (
                  <div key={m.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge>{m.role}</Badge>
                        {m.has_submitted_constraints ? (
                          <Badge>✓ Submitted</Badge>
                        ) : (
                          <Badge>Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Polls */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Polls</h2>
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
              {trip.polls.length === 0 ? (
                <p className="text-slate-400">No polls yet</p>
              ) : (
                <div className="space-y-3">
                  {trip.polls.map((poll) => (
                    <div key={poll.id} className="p-3 bg-slate-800/50 rounded">
                      <p className="font-medium">{poll.question}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {poll.votes.length} votes • {poll.is_open ? "Open" : "Closed"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Required Attendees (Organiser) */}
            <Card className={!isOrganiser ? "opacity-50" : ""}>
              <h2 className="text-lg font-semibold mb-4">Required Attendees</h2>
              <div className="space-y-2 mb-4">
                {trip.members.map((m) => (
                  <label key={m.id} className={`flex items-center gap-2 ${isOrganiser ? "cursor-pointer hover:opacity-70" : "cursor-not-allowed"}`}>
                    <input
                      type="checkbox"
                      checked={selectedRequired.includes(m.id)}
                      onChange={() => toggleRequired(m.id)}
                      disabled={!isOrganiser}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{m.name}</span>
                  </label>
                ))}
              </div>
              <Button
                variant="primary"
                onClick={handleSaveRequired}
                disabled={loading || !isOrganiser}
                title={!isOrganiser ? "Organiser only" : ""}
                className="w-full text-xs py-2"
              >
                Save
              </Button>
            </Card>

            {/* Options */}
            <Card>
              <Button
                variant="primary"
                onClick={() => navigate(`/trip/${trip.trip.id}/options`)}
                disabled={!isOrganiser}
                title={!isOrganiser ? "Organiser only" : ""}
                className="w-full"
              >
                Generate Options
              </Button>
            </Card>

            {/* Trip Info */}
            <Card>
              <h3 className="text-sm font-semibold mb-2">Trip ID</h3>
              <p className="text-xs font-mono bg-slate-800 p-2 rounded break-all">{trip.trip.id}</p>
            </Card>
          </div>
        </div>

        {/* Latest Plan */}
        {trip.latest_plan && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Latest Plan (v{trip.latest_plan.version_num})</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {trip.latest_plan.options.map((opt) => (
                <div key={opt.id} className="p-4 bg-slate-800/50 rounded">
                  <p className="font-semibold">{opt.title}</p>
                  <p className="text-xs text-slate-400">{opt.destination}</p>
                  <p className="text-xs mt-2">{opt.date_window}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
