"use client";

import { useEffect, useState } from "react";
import { loadProjects, projects as defaultProjects } from "../../data/projects";
import { ProjectsIndex } from "../../views/projects";

export default function ProjectsListClient() {
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

  return <ProjectsIndex projects={projects} />;
}

