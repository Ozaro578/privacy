import type { Config } from "@netlify/functions";
import { sweepJobs } from "../lib/jobs.js";

/** Stündlich: nicht abgeholte Ergebnisse älter als 1 Stunde löschen. */
export default async () => {
  const removed = await sweepJobs();
  console.log(JSON.stringify({ event: "jobs.sweep", removed }));
};

export const config: Config = { schedule: "@hourly" };
