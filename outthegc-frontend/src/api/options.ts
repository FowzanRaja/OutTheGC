import { api } from "./client";

export async function generateOptions(trip_id: string, body: {
  created_by_member_id: string;
  duration_days?: number;
}) {
  const { data } = await api.post(`/trips/${trip_id}/generate-options`, body);
  return data;
}

export async function rerunOptions(trip_id: string, body: { created_by_member_id: string }) {
  const { data } = await api.post(`/trips/${trip_id}/rerun-options`, body);
  return data;
}

export async function submitFeedback(trip_id: string, option_id: string, body: {
  member_id: string;
  rating: number;
  disliked_activity_ids: string[];
  comment?: string;
}) {
  const { data } = await api.post(`/trips/${trip_id}/options/${option_id}/feedback`, body);
  return data;
}
