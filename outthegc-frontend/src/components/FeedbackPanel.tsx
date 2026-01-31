import { useState } from "react";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";

interface FeedbackPanelProps {
  optionId: string;
  onSubmit: (optionId: string, rating: number, comment: string, disliked_activities: string[]) => void;
  loading?: boolean;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  optionId,
  onSubmit,
  loading = false,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [disliked, setDisliked] = useState<Set<string>>(new Set());

  const handleDislikeToggle = (activity: string) => {
    const updated = new Set(disliked);
    if (updated.has(activity)) {
      updated.delete(activity);
    } else {
      updated.add(activity);
    }
    setDisliked(updated);
  };

  const handleSubmit = () => {
    onSubmit(optionId, rating, comment, Array.from(disliked));
    setRating(5);
    setComment("");
    setDisliked(new Set());
  };

  const sampleActivities = [
    "Hiking",
    "Water sports",
    "Sightseeing",
    "Shopping",
    "Dining",
    "Nightlife",
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl transition ${
                star <= rating ? "text-yellow-400" : "text-slate-600"
              }`}
            >
              ⭐
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Activities to Avoid
        </label>
        <div className="grid grid-cols-2 gap-2">
          {sampleActivities.map((activity) => (
            <label
              key={activity}
              className="flex items-center gap-2 p-2 rounded hover:bg-slate-800/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={disliked.has(activity)}
                onChange={() => handleDislikeToggle(activity)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-slate-300">{activity}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Comments
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
        />
      </div>

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
};
