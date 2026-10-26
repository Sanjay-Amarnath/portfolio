const FREEHIRE_API = "https://freehire.me/api/v1";

export async function searchFreehireJobs(filters = {}) {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.workMode) params.set("work_mode", filters.workMode);
  if (filters.category) params.set("category", filters.category);
  if (filters.skills?.length) params.set("skills", filters.skills.join(","));
  if (filters.location) params.set("location", filters.location);
  if (filters.limit) params.set("limit", filters.limit);
  if (filters.offset) params.set("offset", filters.offset);

  // Default to remote-friendly IT jobs if no filters
  if (!filters.query && !filters.workMode && !filters.category) {
    params.set("work_mode", "remote");
  }

  const response = await fetch(`${FREEHIRE_API}/jobs?${params.toString()}`, {
    headers: { "Accept": "application/json" },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`freehire API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

export async function getJobDetail(slug) {
  const response = await fetch(`${FREEHIRE_API}/jobs/${slug}`, {
    headers: { "Accept": "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`freehire API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function getCompany(slug) {
  const response = await fetch(`${FREEHIRE_API}/companies/${slug}`, {
    headers: { "Accept": "application/json" },
    next: { revalidate: 86400 },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.data;
}

export function mapFreehireJob(job) {
  return {
    id: job.public_slug,
    slug: job.public_slug,
    title: job.title,
    company: job.company,
    companySlug: job.company_slug,
    location: job.location,
    workMode: job.work_mode || "remote",
    category: job.is_tech === "tech" ? "Engineering" : "Non-tech",
    skills: job.skills || [],
    description: job.description,
    url: job.url,
    directApply: job.direct_apply || false,
    postedAt: job.posted_at,
    createdAt: job.created_at,
    closedAt: job.closed_at,
    countries: job.countries,
    regions: job.regions,
    cities: job.cities,
    metros: job.metros,
    collections: job.collections,
  };
}