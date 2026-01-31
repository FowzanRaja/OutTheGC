import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Me } from "./pages/Me";
import { Polls } from "./pages/Polls";
import { Options } from "./pages/Options";
import { Navigation } from "./components/Navigation";

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!isLanding && <Navigation />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/trip/:tripId/dashboard" element={<Dashboard />} />
        <Route path="/trip/:tripId/me" element={<Me />} />
        <Route path="/trip/:tripId/polls" element={<Polls />} />
        <Route path="/trip/:tripId/options" element={<Options />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
