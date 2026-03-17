import type { StaticTrackDefinition } from "../types";

export const hldContent: StaticTrackDefinition = {
  id: "hld",
  label: "High-level System Design",
  summary: "Review scalable architecture trade-offs and recurring distributed-system patterns.",
  accent: "lavender",
  groups: [
    {
      id: "core-concepts",
      title: "Core Concepts",
      items: [
        { id: "networking-essentials", title: "Networking Essentials" },
        { id: "api-design", title: "API Design" },
        { id: "data-modeling", title: "Data Modeling" },
        { id: "database-indexing", title: "Database Indexing" },
        { id: "caching", title: "Caching" },
        { id: "sharding", title: "Sharding" },
        { id: "consistent-hashing", title: "Consistent Hashing" },
        { id: "cap-theorem", title: "CAP Theorem" },
        { id: "numbers-to-know", title: "Numbers to Know" },
        { id: "question-breakdowns", title: "Question Breakdowns" },
      ],
    },
    {
      id: "patterns",
      title: "Patterns",
      items: [
        { id: "real-time-updates", title: "Real-time Updates" },
        { id: "dealing-with-contention", title: "Dealing with Contention" },
        { id: "multi-step-processes", title: "Multi-step Processes" },
        { id: "scaling-reads", title: "Scaling Reads" },
        { id: "scaling-writes", title: "Scaling Writes" },
        { id: "handling-large-blobs", title: "Handling Large Blobs" },
        { id: "managing-long-running-tasks", title: "Managing Long Running Tasks" },
      ],
    },
    {
      id: "key-technologies",
      title: "Key Technologies",
      items: [
        { id: "redis", title: "Redis" },
        { id: "elasticsearch", title: "Elasticsearch" },
        { id: "kafka", title: "Kafka" },
        { id: "api-gateway", title: "API Gateway" },
        { id: "cassandra", title: "Cassandra" },
        { id: "dynamodb", title: "DynamoDB" },
        { id: "postgresql", title: "PostgreSQL" },
        { id: "flink", title: "Flink" },
        { id: "zookeeper", title: "ZooKeeper" },
        { id: "data-structures-for-big-data", title: "Data Structures for Big Data" },
        { id: "vector-databases", title: "Vector Databases" },
        { id: "time-series-databases", title: "Time Series Databases" },
      ],
    },
  ],
};
