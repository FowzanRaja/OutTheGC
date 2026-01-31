import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TripState } from "../types/api";
import { getTrip } from "../api/trips";
import { loadSession } from "../utils/storage";

type TripCtx = {
  tripId: string | null;
  memberId: string | null;
  trip: TripState | null;
  isOrganiser: boolean;
  refresh: () => Promise<void>;
  setTripId: (id: string) => void;
  setMemberId: (id: string) => void;
};

const Ctx = createContext<TripCtx | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const session = loadSession();
  const [tripId, setTripId] = useState<string | null>(session?.tripId ?? null);
  const [memberId, setMemberId] = useState<string | null>(session?.memberId ?? null);
  const [trip, setTrip] = useState<TripState | null>(null);

  const refresh = async () => {
    if (!tripId) return;
    const data = await getTrip(tripId);
    setTrip(data);
  };

  useEffect(() => { if (tripId) refresh(); }, [tripId]);

  const isOrganiser = useMemo(() => {
    if (!trip || !memberId) return false;
    const me = trip.members.find(m => m.id === memberId);
    return me?.role === "organiser";
  }, [trip, memberId]);

  return (
    <Ctx.Provider value={{ tripId, memberId, trip, isOrganiser, refresh, setTripId, setMemberId }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTrip must be used inside TripProvider");
  return ctx;
}
