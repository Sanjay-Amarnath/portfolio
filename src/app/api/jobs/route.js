import { NextResponse } from "next/server";

const FREEHIRE_API = "https://freehire.me/api/v1";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();

  // Forward known query params
  const keys = ["q", "work_mode", "category", "skills", "location", "limit", "offset"];
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  // Default to remote-friendly IT jobs
  if (!params.has("work_mode") && !params.has("q") && !params.has("category")) {
    params.set("work_mode", "remote");
  }

  try {
    const response = await fetch(`${FREEHIRE_API}/jobs?${params.toString()}`, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `freehire API: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}