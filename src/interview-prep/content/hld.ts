import type { StaticTrackDefinition } from "../types";

export const hldContent: StaticTrackDefinition = {
  id: "hld",
  label: "High-level system design",
  summary: "Review scalable architecture trade-offs and recurring distributed-system patterns.",
  accent: "lavender",
  groups: [
    {
      id: "foundations",
      title: "Foundations",
      items: [
        { id: "requirement-clarification", title: "Requirement Clarification" },
        { id: "capacity-estimation", title: "Capacity Estimation" },
        { id: "api-boundaries", title: "API Boundaries" },
      ],
    },
    {
      id: "scalability",
      title: "Scalability",
      items: [
        { id: "load-balancing", title: "Load Balancing" },
        { id: "caching", title: "Caching" },
        { id: "database-sharding", title: "Database Sharding" },
        { id: "read-replicas", title: "Read Replicas" },
      ],
    },
    {
      id: "asynchronous-systems",
      title: "Asynchronous Systems",
      items: [
        { id: "queues-workers", title: "Queues and Workers" },
        { id: "event-driven-architecture", title: "Event-driven Architecture" },
        { id: "retry-idempotency", title: "Retry and Idempotency" },
      ],
    },
  ],
};
