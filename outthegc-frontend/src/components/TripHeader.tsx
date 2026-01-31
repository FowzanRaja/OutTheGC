import { useState } from "react";
import { updateBrief } from "../api/trips";
import { Button } from "./ui/Button";

interface TripHeaderProps {
  tripId: string;
  title: string;
  origin: string;
  brief?: string;
  isOrganiser: boolean;
  onBriefUpdate?: (brief: string) => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  tripId,
  title,
  origin,
  brief = "",
  isOrganiser,
  onBriefUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [briefText, setBriefText] = useState(brief);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await updateBrief(tripId, briefText);
      setEditing(false);
      onBriefUpdate?.(briefText);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update brief");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-lg mb-6">
      <h1 className="text-3xl font-bold mb-1">{title}</h1>
      <p className="text-indigo-100 mb-4">{origin}</p>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            className="w-full bg-indigo-900/40 border border-indigo-400 rounded px-3 py-2 text-white placeholder-indigo-200 text-sm"
            rows={2}
            placeholder="Trip brief..."
          />
          {error && <p className="text-rose-200 text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={loading}
              className="text-xs px-3 py-1"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setBriefText(brief);
                setError(null);
              }}
              className="text-xs px-3 py-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-indigo-100 mb-3">
            {briefText || "No brief provided"}
          </p>
          <Button
            variant="secondary"
            onClick={() => setEditing(true)}
            disabled={!isOrganiser}
            title={!isOrganiser ? "Organiser only" : ""}
            className="text-xs px-3 py-1"
          >
            Edit Brief
          </Button>
        </>
      )}
    </div>
  );
};
