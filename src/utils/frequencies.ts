export const frequencies = [
  "one-time",
  "minutely",
  "hourly",
  "daily",
  "weekly",
  "bi-weekly",
  "monthly",
] as const;

export type Frequency = (typeof frequencies)[number];
