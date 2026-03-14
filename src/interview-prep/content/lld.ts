import type { StaticTrackDefinition } from "../types";

export const lldContent: StaticTrackDefinition = {
  id: "lld",
  label: "Low-level system design",
  summary: "Practice object modeling, clean interfaces, and implementation-level design fluency.",
  accent: "mint",
  groups: [
    {
      id: "modeling",
      title: "Modeling",
      items: [
        { id: "identify-entities", title: "Identify Entities and Relationships" },
        { id: "state-transitions", title: "State Transitions" },
        { id: "responsibility-splitting", title: "Responsibility Splitting" },
      ],
    },
    {
      id: "patterns",
      title: "Design Patterns",
      items: [
        { id: "factory-pattern", title: "Factory Pattern" },
        { id: "strategy-pattern", title: "Strategy Pattern" },
        { id: "observer-pattern", title: "Observer Pattern" },
      ],
    },
    {
      id: "concurrency",
      title: "Concurrency",
      items: [
        { id: "thread-safety", title: "Thread Safety" },
        { id: "locking-tradeoffs", title: "Locking Trade-offs" },
        { id: "producer-consumer", title: "Producer Consumer" },
      ],
    },
  ],
};
