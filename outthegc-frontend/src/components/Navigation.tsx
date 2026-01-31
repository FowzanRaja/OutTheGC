import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { Button } from "./ui/Button";

export const Navigation: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { trip } = useTrip();

  if (!tripId) return null;

  const isActive = (path: string) =>
    location.pathname.includes(path) ? "bg-indigo-600" : "";

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">{trip?.trip.name || "Trip"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/trip/${tripId}/dashboard`)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              isActive("dashboard")
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate(`/trip/${tripId}/me`)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              isActive("/me")
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Me
          </button>
          <button
            onClick={() => navigate(`/trip/${tripId}/polls`)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              isActive("polls")
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Polls
          </button>
          <button
            onClick={() => navigate(`/trip/${tripId}/options`)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              isActive("options")
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Options
          </button>
          <Button
            variant="secondary"
            onClick={() => navigate("/")}
            className="text-xs px-3 py-1 ml-4"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </nav>
  );
};
