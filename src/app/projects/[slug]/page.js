"use client";

import { useParams } from "next/navigation";
import ProjectDetailClient from "../../../component/projects/ProjectDetailClient";

export default function ProjectDetailPage() {
  const params = useParams();
  return <ProjectDetailClient slug={params.slug} />;
}

