"use client";

import { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  title: string;
  description: string | null;
  link: string;
  isActive: boolean;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/v1/projects");
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const mappedProjects = result.data.map(
            (p: Project & { title: string }) => ({
              ...p,
              name: p.title || p.name,
            }),
          );
          setProjects(mappedProjects);
        } else {
          setError(result.message || "Failed to fetch projects");
          setProjects([]);
        }
      } catch (err) {
        setError("An error occurred while fetching projects");
        setProjects([]);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, isLoading, error };
}
