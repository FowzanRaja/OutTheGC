import { api } from "./client";
import type { Poll } from "../types/api";

export async function createPoll(trip_id: string, body: {
  created_by_member_id: string;
  type: "single" | "multi";
  question: string;
  options: Array<{ label: string }>;
}) {
  const { data } = await api.post(`/trips/${trip_id}/polls`, body);
  return data as Poll;
}

export async function vote(poll_id: string, body: { member_id: string; option_id: string }) {
  const { data } = await api.post(`/polls/${poll_id}/vote`, body);
  return data;
}

export async function closePoll(poll_id: string, body: { member_id: string }) {
  const { data } = await api.post(`/polls/${poll_id}/close`, body);
  return data;
}
