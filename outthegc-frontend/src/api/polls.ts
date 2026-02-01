import { api } from "./client";
import type { Poll } from "../types/api";

export async function createPoll(trip_id: string, body: {
  created_by_member_id: string;
  type: "single" | "multi" | "slider";
  question: string;
  options?: Array<{ label: string }>;
  slider_title?: string;
  left_label?: string;
  right_label?: string;
  slider?: {
    title?: string;
    left_label: string;
    right_label: string;
    min?: number;
    max?: number;
    step?: number;
  };
}) {
  const { data } = await api.post(`/trips/${trip_id}/polls`, body);
  return data as Poll;
}

export async function vote(
  trip_id: string,
  poll_id: string,
  body: { member_id: string; option_id?: string; value?: number }
) {
  const { data } = await api.post(`/trips/${trip_id}/polls/${poll_id}/vote`, body);
  return data;
}

export async function closePoll(trip_id: string, poll_id: string, body: { member_id: string }) {
  const { data } = await api.post(`/trips/${trip_id}/polls/${poll_id}/close`, body);
  return data;
}
