import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateBrief } from "../api/trips";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useTrip } from "../context/TripContext";

export const Dashboard: React.FC = () => {
  const { tripId: routeId } = useParams<{ tripId: string }>();
  const { tripId, trip, isOrganiser, refresh, setTripId } = useTrip();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [briefText, setBriefText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement | null>(null);

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

  const formatLabel = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;

  const activePolls = trip.polls;

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

        {/* Trip Brief */}
        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Trip Brief</h2>
              {!editing && <p className="text-slate-300 mt-2">{trip.trip.brief || "No brief provided"}</p>}
            </div>
            <Button
              variant="secondary"
              onClick={() => setEditing(!editing)}
              disabled={!isOrganiser}
              title={!isOrganiser ? "Organiser only" : ""}
              className="text-xs px-3 py-1 shadow-lg hover:shadow-xl"
            >
              {editing ? "Cancel" : "Edit Brief"}
            </Button>
          </div>
          {editing && (
            <div className="mt-4 space-y-3">
              <textarea
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleSaveBrief} disabled={loading} className="shadow-lg hover:shadow-xl">
                  Save
                </Button>
                <Button variant="secondary" onClick={() => setEditing(false)} className="shadow-lg hover:shadow-xl">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Members */}
        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Members</h2>
            <Button variant="secondary" className="text-xs px-3 py-1 shadow-lg hover:shadow-xl">
              Edit profile
            </Button>
          </div>
          <div className="space-y-2">
            {trip.members.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="font-medium">{m.name}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge>{formatLabel(m.role)}</Badge>
                  <Badge>{m.has_submitted_constraints ? "Submitted" : "Pending"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Polls */}
        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Polls</h2>
            <Button
              variant="primary"
              onClick={() => navigate(`/trip/${trip.trip.id}/polls`)}
              disabled={!isOrganiser}
              title={!isOrganiser ? "Organiser only" : ""}
              className="text-xs px-3 py-1 shadow-lg hover:shadow-xl"
            >
              Create poll
            </Button>
          </div>
          {activePolls.length === 0 ? (
            <p className="text-slate-400">No active polls</p>
          ) : (
            <div className="space-y-3">
              {activePolls.map((poll) => (
                <div key={poll.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="font-medium">{poll.question}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {poll.votes.length} votes • {poll.is_open ? "Open" : "Closed"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Bottom action */}
        <div className="flex justify-center pt-2">
          <Button
            variant="primary"
            onClick={() => navigate(`/trip/${trip.trip.id}/options`)}
            disabled={!isOrganiser}
            title={!isOrganiser ? "Organiser only" : ""}
            className="w-full sm:w-auto min-w-[220px] shadow-lg hover:shadow-xl"
          >
            Generate trip
          </Button>
        </div>
      </div>
    </div>
  );
};