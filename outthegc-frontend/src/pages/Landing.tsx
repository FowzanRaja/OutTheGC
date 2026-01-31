import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip, joinTrip } from "../api/trips";
import { saveSession } from "../utils/storage";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Trip
  const [createForm, setCreateForm] = useState({
    name: "",
    origin: "",
    brief: "",
    organiser_name: "",
  });

  // Join Trip
  const [joinForm, setJoinForm] = useState({
    trip_id: "",
    name: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createTrip({
        name: createForm.name,
        origin: createForm.origin,
        brief: createForm.brief || undefined,
        organiser_name: createForm.organiser_name,
      });
      saveSession({ tripId: result.trip_id, memberId: result.organiser_member_id });
      navigate(`/trip/${result.trip_id}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await joinTrip(joinForm.trip_id, { name: joinForm.name });
      saveSession({ tripId: joinForm.trip_id, memberId: result.member_id });
      navigate(`/trip/${joinForm.trip_id}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to join trip");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">OutTheGC</h1>
          <p className="text-xl text-indigo-100 mb-12">Plan trips with your friends</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
            <button
              onClick={() => setMode("create")}
              className="p-8 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg text-white transition"
            >
              <h2 className="text-2xl font-bold mb-2">Create Trip</h2>
              <p className="text-indigo-100">Start a new adventure</p>
            </button>
            <button
              onClick={() => setMode("join")}
              className="p-8 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg text-white transition"
            >
              <h2 className="text-2xl font-bold mb-2">Join Trip</h2>
              <p className="text-indigo-100">Join an existing trip</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white">
          {mode === "create" ? "Create Trip" : "Join Trip"}
        </h2>

        {error && <div className="mb-4 p-3 bg-rose-900/30 border border-rose-500 rounded text-rose-200 text-sm">{error}</div>}

        {mode === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              placeholder="Trip name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <Input
              placeholder="Origin city"
              value={createForm.origin}
              onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value })}
              required
            />
            <Input
              placeholder="Brief description (optional)"
              value={createForm.brief}
              onChange={(e) => setCreateForm({ ...createForm, brief: e.target.value })}
            />
            <Input
              placeholder="Your name (organiser)"
              value={createForm.organiser_name}
              onChange={(e) => setCreateForm({ ...createForm, organiser_name: e.target.value })}
              required
            />
            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setMode("home")} className="flex-1">
                Back
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              placeholder="Trip ID"
              value={joinForm.trip_id}
              onChange={(e) => setJoinForm({ ...joinForm, trip_id: e.target.value })}
              required
            />
            <Input
              placeholder="Your name"
              value={joinForm.name}
              onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
              required
            />
            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                {loading ? "Joining..." : "Join"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setMode("home")} className="flex-1">
                Back
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
