"use client";

import { useEffect, useState } from "react";
import { loadProjects, projects as defaultProjects } from "../../data/projects";
import { ProjectDetail } from "../../views/projects";

export default function ProjectDetailClient({ slug }) {
  const [projects, setProjects] = useState(defaultProjects);

  useEffect(() => {
    let isMounted = true;
    loadProjects()
      .then((loadedProjects) => {
        if (isMounted) setProjects(loadedProjects);
      })
      .catch((error) => {
        console.error("Could not load portfolio projects:", error);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return <ProjectDetail slug={slug} projects={projects} />;
}

