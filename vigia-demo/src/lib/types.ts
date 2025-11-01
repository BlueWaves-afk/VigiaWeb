export type Hazard = {
  class: "pothole" | "speed_breaker_unmarked" | "debris" | "stalled_vehicle";
  lat: number;
  lng: number;
  severity?: number;
  last_seen?: string;
  weather?: string[];
};