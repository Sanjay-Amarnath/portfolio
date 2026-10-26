import JobsPageClient from "./JobsPageClient";
import { searchFreehireJobs, mapFreehireJob } from "@/lib/freehire";

export const revalidate = 3600; // Revalidate every hour

export default async function JobsPage() {
  // Server-side fetch - no CORS issues
  const rawJobs = await searchFreehireJobs({ workMode: "remote" });
  const jobs = rawJobs.map(mapFreehireJob);

  return <JobsPageClient initialJobs={jobs} />;
}
