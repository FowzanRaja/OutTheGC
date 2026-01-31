import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { submitConstraints } from "../api/trips";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";

export const Me: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { memberId, trip, refresh } = useTrip();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    available_dates: "" as string, // dates separated by commas or as range
    budget_min: "",
    budget_max: "",
    energy_level: 3, // 0-5
    social_preference: 3, // 0-5
    must_haves: "", // comma separated
    must_avoids: "", // comma separated
    special_request: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId || !memberId) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const constraintBody = {
        available_dates: form.available_dates ? form.available_dates.split(",").map((d) => d.trim()) : [],
        budget: {
          min: form.budget_min ? Number(form.budget_min) : null,
          max: form.budget_max ? Number(form.budget_max) : null,
        },
        energy_level: form.energy_level,
        social_preference: form.social_preference,
        must_haves: form.must_haves ? form.must_haves.split(",").map((t) => t.trim()) : [],
        must_avoids: form.must_avoids ? form.must_avoids.split(",").map((t) => t.trim()) : [],
        special_request: form.special_request || null,
      };

      await submitConstraints(tripId, memberId, constraintBody);
      setSuccess(true);
      refresh();
      setTimeout(() => navigate(`/trip/${tripId}/dashboard`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit constraints");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Preferences</h1>
          <p className="text-slate-400">{trip?.trip.name}</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-500 rounded text-emerald-200">
            Constraints submitted! Redirecting...
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-900/30 border border-rose-500 rounded text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Availability */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Availability</h2>
            <p className="text-sm text-slate-400 mb-3">Enter dates you're available (comma separated)</p>
            <Input
              type="text"
              placeholder="e.g., 2025-06-15, 2025-06-16, 2025-06-17"
              value={form.available_dates}
              onChange={(e) => setForm({ ...form, available_dates: e.target.value })}
            />
          </Card>

          {/* Budget */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Budget Range (USD)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Minimum</label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={form.budget_min}
                  onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Maximum</label>
                <Input
                  type="number"
                  placeholder="5000"
                  min="0"
                  value={form.budget_max}
                  onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Sliders */}
          <Card>
            <h2 className="text-lg font-semibold mb-6">Preferences</h2>

            {/* Energy Level */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Energy Level</label>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded">{form.energy_level}/5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={form.energy_level}
                onChange={(e) => setForm({ ...form, energy_level: Number(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Relaxed</span>
                <span>Active</span>
              </div>
            </div>

            {/* Social Preference */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Social Preference</label>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded">{form.social_preference}/5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={form.social_preference}
                onChange={(e) => setForm({ ...form, social_preference: Number(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Solo Time</span>
                <span>Group Hangout</span>
              </div>
            </div>
          </Card>

          {/* Tags */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Tags</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Must-Haves</label>
              <Input
                type="text"
                placeholder="e.g., hiking, beach, nightlife"
                value={form.must_haves}
                onChange={(e) => setForm({ ...form, must_haves: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Must-Avoids</label>
              <Input
                type="text"
                placeholder="e.g., extreme sports, very crowded places"
                value={form.must_avoids}
                onChange={(e) => setForm({ ...form, must_avoids: e.target.value })}
              />
            </div>
          </Card>

          {/* Special Request */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Special Request</h2>
            <Textarea
              placeholder="Any specific requests or notes for the organiser..."
              rows={4}
              value={form.special_request}
              onChange={(e) => setForm({ ...form, special_request: e.target.value })}
            />
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Submit Constraints"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/trip/${tripId}/dashboard`)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
