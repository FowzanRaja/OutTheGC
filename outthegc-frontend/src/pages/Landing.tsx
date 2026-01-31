import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip, joinTrip } from "../api/trips";
import { saveSession } from "../utils/storage";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { HeroImageCards } from "../components/HeroImageCards";

type PageMode = "home" | "create" | "join";

const LandingHero: React.FC<{
  onCreateClick: () => void;
  onJoinClick: () => void;
}> = ({ onCreateClick, onJoinClick }) => {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(15px, -10px) rotate(1deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-drift {
          animation: drift 4s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500" />

        {/* Abstract Blob Shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-3xl opacity-20 pointer-events-none" />

        {/* Orbit Container */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
          <HeroImageCards layout="desktop" />
        </div>

        {/* Centered Hero Content */}
        <div className="relative z-30 h-full min-h-screen py-16 lg:py-24 flex items-center justify-center">
          <div className="max-w-2xl px-6 lg:px-10 w-full">
            <div className="text-center flex flex-col items-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-5 leading-tight">
                Plan Your <span className="bg-gradient-to-r from-pink-200 to-cyan-200 bg-clip-text text-transparent">Perfect Trip</span>
              </h1>

              <p className="text-lg md:text-xl text-white/85 mb-6 leading-relaxed">
                Collaborate with friends, vote on destinations, and create unforgettable memories together.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <button
                  onClick={onCreateClick}
                  className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-full hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105 shadow-lg whitespace-nowrap"
                >
                  Create Trip
                </button>
                <button
                  onClick={onJoinClick}
                  className="px-8 py-3 bg-white/20 backdrop-blur border border-white/40 text-white font-bold rounded-full hover:bg-white/30 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  Join Trip
                  <span className="text-xl">→</span>
                </button>
              </div>

              {/* Mobile cards below text */}
              <div className="mt-10 w-full lg:hidden">
                <HeroImageCards layout="mobile" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const FormModal: React.FC<{
  mode: "create" | "join";
  onBack: () => void;
}> = ({ mode, onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    origin: "",
    brief: "",
    organiser_name: "",
  });

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
      navigate(`/trip/${result.trip_id}/dashboard`, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Failed to create trip");
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
      navigate(`/trip/${joinForm.trip_id}/dashboard`, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Failed to join trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-sky-400 to-purple-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white">
          {mode === "create" ? "Create Trip" : "Join Trip"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-900/30 border border-rose-500 rounded text-rose-200 text-sm">
            {error}
          </div>
        )}

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
            <Textarea
              placeholder="Brief description (optional)"
              value={createForm.brief}
              onChange={(e) => setCreateForm({ ...createForm, brief: e.target.value })}
              rows={5}
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
              <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
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
              <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
                Back
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export const Landing: React.FC = () => {
  const [mode, setMode] = useState<PageMode>("home");

  if (mode === "home") {
    return (
      <LandingHero
        onCreateClick={() => setMode("create")}
        onJoinClick={() => setMode("join")}
      />
    );
  }

  return (
    <FormModal
      mode={mode as "create" | "join"}
      onBack={() => setMode("home")}
    />
  );
};
