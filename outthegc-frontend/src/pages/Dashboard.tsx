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
  const [generatingTrip, setGeneratingTrip] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const generatedContent = "";

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

  useEffect(() => {
    if (!copied) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (copyButtonRef.current && target && copyButtonRef.current.contains(target)) {
        return;
      }
      setCopied(false);
    };

    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => window.removeEventListener("pointerdown", handlePointerDown, true);
  }, [copied]);

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

  const handleCopyTripId = async () => {
    try {
      await navigator.clipboard.writeText(trip.trip.id);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy trip id:", err);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Out the GC</h1>
            <p className="text-white/70">{trip.trip.name}</p>
          </div>
          <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-300">Trip ID</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                  {trip.trip.id}
                </span>
                <Button
                  ref={copyButtonRef}
                  variant="secondary"
                  onClick={handleCopyTripId}
                  aria-label={copied ? "Copied" : "Copy trip id"}
                  className="p-2 shadow-lg hover:shadow-xl"
                >
                  {copied ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25a1 1 0 1 1 1.414-1.414l2.543 2.543 6.543-6.543a1 1 0 0 1 1.414 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Z" />
                      <path d="M18 5H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H10V7h8v14Z" />
                    </svg>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
        {/* Trip Brief */}
        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Trip Brief (Used by AI)</h2>
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
          </div>
          <div className="space-y-2">
            {trip.members.map((m) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="font-medium">{m.name}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge>{formatLabel(m.role)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Polls */}
        <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl transition-transform hover:-translate-y-0.5 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Polls</h2>
            {isOrganiser ? (
              <Button
                variant="primary"
                onClick={() => navigate(`/trip/${trip.trip.id}/polls`)}
                className="text-xs px-3 py-1 shadow-lg hover:shadow-xl"
              >
                View polls
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => navigate(`/trip/${trip.trip.id}/polls`)}
                className="text-xs px-3 py-1 shadow-lg hover:shadow-xl"
              >
                View Polls
              </Button>
            )}
          </div>
          {activePolls.length === 0 ? (
            <p className="text-slate-400">No active polls</p>
          ) : (
            <div className="space-y-3">
              {activePolls.map((poll) => (
                <div key={poll.id} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="font-medium">{poll.question}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {poll.votes.length} votes
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
        </div>

        {/* Bottom action */}
        <div className="flex justify-center pt-8">
          <Button
            variant="primary"
            onClick={() => setGeneratingTrip(true)}
            disabled={!isOrganiser}
            title={!isOrganiser ? "Organiser only" : ""}
            className="w-full sm:w-auto min-w-[220px] shadow-lg hover:shadow-xl"
          >
            Generate trip
          </Button>
        </div>

        {/* AI Generated Content Box */}
        {generatingTrip && (
          <div className="mt-8">
            <Card className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl min-h-96">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold">Generated Trip Plan</h2>
                <Button
                  variant="secondary"
                  onClick={() => setGeneratingTrip(false)}
                  className="text-xs px-3 py-1"
                >
                  Close
                </Button>
              </div>
              <div className="text-slate-300 p-4 bg-slate-800/30 rounded-lg min-h-80 flex items-center justify-center">
                {generatedContent || "AI-generated trip plan will appear here"}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};