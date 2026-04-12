import type { StaticTrackDefinition } from "../types";

export const lldContent: StaticTrackDefinition = {
  id: "lld",
  label: "Low-level System Design",
  summary: "Practice object modeling, clean interfaces, and implementation-level design fluency.",
  accent: "mint",
  groups: [
    {
      id: "core-concepts",
      title: "Core Concepts",
      linkSection: "in-a-hurry",
      items: [
        { id: "design-principles", title: "Design Principles" },
        { id: "oop-concepts", title: "OOP Concepts" },
        { id: "design-patterns", title: "Design Patterns" },
      ],
    },
    {
      id: "concurrency",
      title: "Concurrency",
      linkSection: "concurrency",
      items: [
        { id: "correctness", title: "Correctness" },
        { id: "coordination", title: "Coordination" },
        { id: "scarcity", title: "Scarcity" },
      ],
    },
    {
      id: "examples",
      title: "Examples",
      linkSection: "problem-breakdowns",
      items: [
        { id: "connect-four", title: "Connect Four" },
        { id: "amazon-locker", title: "Amazon Locker" },
        { id: "elevator", title: "Elevator" },
        { id: "parking-lot", title: "Parking Lot" },
        { id: "file-system", title: "File System" },
        { id: "movie-ticket-booking", title: "Movie Ticket Booking" },
        { id: "rate-limiter", title: "Rate Limiter" },
        { id: "inventory-management", title: "Inventory Management" },
      ],
    },
  ],
};
