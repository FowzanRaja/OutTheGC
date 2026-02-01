import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { setRequiredAttendees } from "../api/trips";
=======
import { updateBrief } from "../api/trips";
>>>>>>> Stashed changes
=======
import { updateBrief } from "../api/trips";
>>>>>>> Stashed changes
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { PollCard } from "../components/PollCard";

export const Dashboard: React.FC = () => {
  const { tripId: routeId } = useParams<{ tripId: string }>();
  const { tripId, trip, isOrganiser, refresh, setTripId, memberId } = useTrip();
  const navigate = useNavigate();
<<<<<<< Updated upstream
  const [selectedRequired, setSelectedRequired] = useState<string[]>([]);
=======
  const [editing, setEditing] = useState(false);
  const [briefText, setBriefText] = useState("");
<<<<<<< Updated upstream
>>>>>>> Stashed changes
  const [loading, setLoading] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [copied, setCopied] = useState(false);
=======
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement | null>(null);
>>>>>>> Stashed changes

  // Sync route trip ID with context
  useEffect(() => {
    if (routeId && routeId !== tripId) {
      setTripId(routeId);
    }
  }, [routeId, tripId, setTripId]);

  // Initialize form states
  useEffect(() => {
<<<<<<< Updated upstream
    if (trip) {
      setSelectedRequired(trip.trip.required_member_ids || []);
=======
    if (trip && !editing) {
      setBriefText(trip.trip.brief || "");
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    }
  }, [trip]);

  // 2.5 second polling refresh
  useEffect(() => {
    const interval = setInterval(() => refresh(), 2500);
    return () => clearInterval(interval);
  }, [tripId, refresh]);

<<<<<<< Updated upstream
  if (!trip) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
=======
  useEffect(() => {
    if (!copied) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (copyButtonRef.current && target && copyButtonRef.current.contains(target)) {
        return;
      }
      setCopied(false);
    };

    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    return () => window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
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
>>>>>>> Stashed changes

  const handleSaveRequired = async (requiredIds: string[]) => {
    setLoading(true);
    try {
<<<<<<< Updated upstream
      await setRequiredAttendees(trip.trip.id, requiredIds);
      setSelectedRequired(requiredIds);
      refresh();
    } catch (err: any) {
      console.error("Failed to update required attendees:", err);
=======
      await updateBrief(trip.trip.id, briefText);
      setEditing(false);
      refresh();
    } catch (err: any) {
      console.error("Failed to update brief:", err);
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  };
<<<<<<< Updated upstream
=======

<<<<<<< Updated upstream
  const activePolls = trip.polls.filter((poll) => poll.is_open);
>>>>>>> Stashed changes

  const copyTripId = async () => {
    try {
      await navigator.clipboard.writeText(trip.trip.id);
    } catch {
      // no-op
    }
  };

  const handleRemoveRequired = async (memberId: string) => {
    if (!isOrganiser) return;
    const next = selectedRequired.filter((id) => id !== memberId);
    await handleSaveRequired(next);
  };
=======
  const formatLabel = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;

  const activePolls = trip.polls;
>>>>>>> Stashed changes

  const handleCopyTripId = async () => {
    try {
      await navigator.clipboard.writeText(trip.trip.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy trip ID", err);
    }
  };

  const activePolls = trip.polls.filter((p) => p.is_open);
  const endedPolls = trip.polls.filter((p) => !p.is_open);

  return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{trip.trip.name}</h1>
          <p className="text-slate-400">{trip.trip.origin}</p>
=======
    <div className="min-h-screen relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
<<<<<<< Updated upstream
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold">{trip.trip.name}</h1>
            <p className="text-white/70">{trip.trip.origin}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2 shadow-xl">
            <div>
              <p className="text-xs uppercase text-white/60">Trip ID</p>
              <p className="text-xs font-mono break-all">{trip.trip.id}</p>
            </div>
            <Button variant="secondary" onClick={copyTripId} className="text-xs px-3 py-1">
              Copy
            </Button>
          </div>
>>>>>>> Stashed changes
        </div>

        {/* Trip Brief */}
        <Card className="transition-transform hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Trip Brief</h2>
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
            </div>
            <Button
              variant="secondary"
              onClick={() => setEditing(!editing)}
              disabled={!isOrganiser}
              title={!isOrganiser ? "Organiser only" : ""}
              className="text-xs px-3 py-1 self-start sm:self-center"
            >
              {editing ? "Cancel" : "Edit Brief"}
            </Button>
          </div>
        </Card>

        {/* Members */}
        <Card className="transition-transform hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Members</h2>
            <Button variant="secondary" className="text-xs px-3 py-1">
              {isOrganiser ? "Manage members" : "Edit myself"}
            </Button>
          </div>
          <div className="space-y-2">
            {trip.members.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-slate-800/50 rounded"
              >
                <p className="font-medium">{m.name}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</Badge>
                  <Badge>{m.has_submitted_constraints ? "Submitted" : "Pending"}</Badge>
                </div>
<<<<<<< Updated upstream
              )}
            </Card>
=======
=======
>>>>>>> Stashed changes
    <div className="min-h-screen relative overflow-hidden text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Top Bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{trip.trip.name}</h1>
            <p className="text-white/70">{trip.trip.origin}</p>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">Trip ID:</span>
            <span className="text-xs font-mono bg-white/10 border border-white/15 px-2 py-1 rounded">{trip.trip.id}</span>
            <button
              type="button"
              onClick={handleCopyTripId}
              className="text-xs px-2 py-1 rounded border border-white/15 bg-white/10 hover:bg-white/20 transition"
            >
              {copied ? "Copied" : "Copy"}
            </button>
=======
              </div>
            ))}
>>>>>>> Stashed changes
=======
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-4xl font-bold">{trip.trip.name}</h1>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <span className="font-semibold">Trip ID</span>
            <span className="text-xs font-mono bg-white/10 border border-white/15 rounded-lg px-2 py-1 break-all">
              {trip.trip.id}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(trip.trip.id);
                setCopied(true);
              }}
              ref={copyButtonRef}
              className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs hover:shadow-lg transition"
              title={copied ? "Copied" : "Copy Trip ID"}
              aria-label={copied ? "Copied" : "Copy trip id"}
            >
              {copied ? "✓" : "⧉"}
            </button>
>>>>>>> Stashed changes
          </div>
        </Card>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        {/* Summary Card */}
        <Card className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Summary</h2>
              <p className="text-white/80">{trip.trip.brief || "No brief provided"}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsManageOpen(true)}
              disabled={!isOrganiser}
              title={!isOrganiser ? "Organiser only" : ""}
              className="self-start text-xs px-3 py-2"
            >
              Manage members
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold mb-3">Members</h3>
            <div className="space-y-2">
              {trip.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{m.name}</span>
                    {m.has_submitted_constraints ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15">Submitted</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15">Pending</span>
                    )}
                  </div>
                  <Badge>{m.role}</Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-white/70">Required attendees:</span>
              {selectedRequired.length === 0 ? (
                <span className="text-sm text-white/60">None</span>
              ) : (
                selectedRequired.map((id) => {
                  const member = trip.members.find((m) => m.id === id);
                  if (!member) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/10 border border-white/15"
                    >
                      {member.name}
                      {isOrganiser && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequired(id)}
                          className="ml-1 text-white/70 hover:text-white"
                          aria-label={`Remove ${member.name}`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        {/* Polls Area */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Active polls</h2>
              <Button
                variant="primary"
                onClick={() => navigate(`/trip/${trip.trip.id}/polls`)}
                disabled={!isOrganiser}
                title={!isOrganiser ? "Organiser only" : ""}
                className="text-xs px-3 py-1"
              >
                Create poll
              </Button>
            </div>
            {activePolls.length === 0 ? (
              <Card>
                <p className="text-white/70">No active polls</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activePolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    memberId={memberId || ""}
                    onVote={() => navigate(`/trip/${trip.trip.id}/polls`)}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Ended polls</h2>
            {endedPolls.length === 0 ? (
              <Card>
                <p className="text-white/70">No ended polls</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {endedPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    memberId={memberId || ""}
                    onVote={() => navigate(`/trip/${trip.trip.id}/polls`)}
                    loading={loading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Center CTA */}
        <div className="mt-10 flex justify-center">
=======
        {/* Polls */}
        <Card className="transition-transform hover:-translate-y-1 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Polls</h2>
            <Button
              variant="primary"
              onClick={() => navigate(`/trip/${trip.trip.id}/polls`)}
              disabled={!isOrganiser}
              title={!isOrganiser ? "Organiser only" : ""}
              className="text-xs px-3 py-1"
            >
              Create poll
            </Button>
          </div>
          {activePolls.length === 0 ? (
            <p className="text-slate-400">No polls yet</p>
          ) : (
            <div className="space-y-3">
              {activePolls.map((poll) => (
                <div key={poll.id} className="p-3 bg-slate-800/50 rounded">
                  <p className="font-medium">{poll.question}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {poll.votes.length} votes • Open
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Bottom Action */}
        <div className="flex justify-center">
>>>>>>> Stashed changes
=======
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
>>>>>>> Stashed changes
          <Button
            variant="primary"
            onClick={() => navigate(`/trip/${trip.trip.id}/options`)}
            disabled={!isOrganiser}
            title={!isOrganiser ? "Organiser only" : ""}
<<<<<<< Updated upstream
<<<<<<< Updated upstream
            className="w-full sm:w-auto px-8 py-3"
=======
            className="w-full sm:w-auto px-6 py-3 shadow-lg hover:shadow-xl"
>>>>>>> Stashed changes
=======
            className="w-full sm:w-auto min-w-[220px] shadow-lg hover:shadow-xl"
>>>>>>> Stashed changes
          >
            Generate trip
          </Button>
        </div>
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      </div>

      {isManageOpen && (
        <ManageMembersModal
          members={trip.members}
          requiredIds={selectedRequired}
          loading={loading}
          isOrganiser={isOrganiser}
          onClose={() => setIsManageOpen(false)}
          onToggle={toggleRequired}
          onSave={() => handleSaveRequired(selectedRequired)}
        />
      )}
    </div>
  );
};

const ManageMembersModal: React.FC<{
  members: Array<{ id: string; name: string; role: string; has_submitted_constraints: boolean }>;
  requiredIds: string[];
  loading: boolean;
  isOrganiser: boolean;
  onClose: () => void;
  onToggle: (id: string) => void;
  onSave: () => void;
}> = ({ members, requiredIds, loading, isOrganiser, onClose, onToggle, onSave }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Manage members</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
            {members.map((m) => (
              <label key={m.id} className="flex items-center justify-between gap-3 p-2 rounded bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={requiredIds.includes(m.id)}
                    onChange={() => onToggle(m.id)}
                    disabled={!isOrganiser}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">{m.name}</span>
                  {m.has_submitted_constraints ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15">Submitted</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/15">Pending</span>
                  )}
                </div>
                <Badge>{m.role}</Badge>
              </label>
            ))}
          </div>
          <div className="mt-5 flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose} className="text-xs px-3 py-2">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              disabled={!isOrganiser || loading}
              className="text-xs px-3 py-2"
            >
              Save
            </Button>
          </div>
        </Card>
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      </div>
    </div>
  );
};
