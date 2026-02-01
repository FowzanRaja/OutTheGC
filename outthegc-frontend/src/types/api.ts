export type TripState = {
  trip: {
    id: string;
    name: string;
    origin: string;
    brief?: string;
    organiser_member_id: string;
    required_member_ids: string[];
  };
  members: Array<{
    id: string;
    name: string;
    role: "organiser" | "member";
    has_submitted_constraints: boolean;
  }>;
  polls: Poll[];
  latest_plan?: {
    plan_version_id: string;
    version_num: number;
    options: Option[];
  };
};

export type Poll = {
  id: string;
  type: "single" | "multi" | "slider";
  question: string;
  options: Array<{ id: string; label: string }>;
  slider?: {
    title?: string;
    left_label: string;
    right_label: string;
    min?: number;
    max?: number;
    step?: number;
  } | null;
  is_open: boolean;
  votes: Vote[];
};

export type Vote = {
  member_id: string;
  member_name: string;
  option_id?: string | null;
  value?: number | null;
};

export type ItineraryBlock = {
  id: string;
  day: number;
  time: string;
  title: string;
  description?: string;
};

export type Option = {
  id: string;
  title: string;
  destination: string;
  date_window: string;
  summary: string;
  itinerary: ItineraryBlock[];
  costs: Record<string, number>;
  packing_list: string[];
  transport: Array<{ mode: string; details: string; price_estimate?: number }>;
  rationale: string;
};
