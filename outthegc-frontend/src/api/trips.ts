import { api } from "./client";
import type { TripState } from "../types/api";

export async function createTrip(input: {
  name: string;
  origin: string;
  brief?: string;
  organiser_name: string;
}) {
  const { data } = await api.post("/trips", input);
  return data as { trip_id: string; organiser_member_id: string };
}

export async function joinTrip(trip_id: string, input: { name: string }) {
  const { data } = await api.post(`/trips/${trip_id}/join`, input);
  return data as { member_id: string };
}

export async function getTrip(trip_id: string) {
  const { data } = await api.get(`/trips/${trip_id}`);
  return data as TripState;
}

export async function updateBrief(trip_id: string, brief: string) {
  const { data } = await api.put(`/trips/${trip_id}/brief`, { brief });
  return data;
}

export async function setRequiredAttendees(trip_id: string, required_member_ids: string[]) {
  const { data } = await api.put(`/trips/${trip_id}/required-attendees`, { required_member_ids });
  return data;
}

export async function submitConstraints(trip_id: string, member_id: string, body: any) {
  const { data } = await api.put(`/trips/${trip_id}/members/${member_id}/constraints`, body);
  return data;
}

export async function seedDemo(trip_id: string) {
  const { data } = await api.post(`/trips/${trip_id}/seed`);
  return data;
}
