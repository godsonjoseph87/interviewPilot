export interface TechnicalTopic {
  id: string;
  name: string;
  category: 'core_java' | 'spring' | 'distributed' | 'data' | 'architecture' | 'dsa';
  description: string;
  defaultMinutes?: number;
}

export const TECHNICAL_TOPICS: TechnicalTopic[] = [
  { id: 'java_oop', name: 'Java and OOP', category: 'core_java', description: 'Core OOP, class design, encapsulation, polymorphism', defaultMinutes: 8 },
  { id: 'java_collections', name: 'Java Collections Framework', category: 'core_java', description: 'HashMap internals, ConcurrentHashMap, List, Set, performance' },
  { id: 'java_streams', name: 'Java 8+ features and Streams', category: 'core_java', description: 'Lambdas, Streams API, Optional, modern Java features' },
  { id: 'java_concurrency', name: 'Java Concurrency and Multithreading', category: 'core_java', description: 'Threads, locks, executors, memory visibility, race conditions' },
  { id: 'jvm_memory', name: 'JVM and Memory Management', category: 'core_java', description: 'Garbage collection, heap, metaspace, memory leak analysis' },
  { id: 'spring_boot', name: 'Spring Boot', category: 'spring', description: 'Auto-configuration, actuators, dependency injection, beans', defaultMinutes: 10 },
  { id: 'spring_security', name: 'Spring Security', category: 'spring', description: 'Authentication, authorization, JWT, filter chains, OAuth2' },
  { id: 'spring_jpa', name: 'Spring Data JPA and Hibernate', category: 'spring', description: 'N+1 problem, lazy loading, transactions, entity mappings' },
  { id: 'microservices', name: 'Microservices Architecture', category: 'distributed', description: 'Service discovery, API gateway, circuit breakers, saga pattern' },
  { id: 'rest_api', name: 'REST API Design', category: 'distributed', description: 'REST principles, idempotency, versioning, error contracts' },
  { id: 'kafka_messaging', name: 'Kafka and Distributed Messaging', category: 'distributed', description: 'Offsets, consumer groups, partitions, at-least-once delivery', defaultMinutes: 8 },
  { id: 'mysql_optimization', name: 'MySQL and Database Optimization', category: 'data', description: 'Indexing, query tuning, transaction isolation, deadlocks' },
  { id: 'redis_caching', name: 'Redis and Caching', category: 'data', description: 'Cache-aside, eviction policies, distributed locks, stampede' },
  { id: 'system_design', name: 'System Design and Architecture', category: 'architecture', description: 'High availability, scalability, partitioning, CAP theorem', defaultMinutes: 10 },
  { id: 'design_patterns', name: 'Design Patterns', category: 'architecture', description: 'Factory, Singleton, Observer, Strategy, Decorator, Builder' },
  { id: 'real_world_problems', name: 'Real-world Production Problem Solving', category: 'architecture', description: 'Production incident debugging, latency spikes, root cause analysis', defaultMinutes: 7 },
  { id: 'dsa', name: 'Data Structures and Algorithms', category: 'dsa', description: 'Arrays, Trees, Graphs, DP, complexity analysis', defaultMinutes: 12 },
];

export const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Junior / Easy', description: 'Foundational concepts, clean coding, straightforward algorithms' },
  { id: 'medium', label: 'Mid-Level / Medium', description: 'In-depth framework knowledge, concurrent scenarios, trade-offs' },
  { id: 'hard', label: 'Senior / Hard', description: 'Production diagnostics, distributed systems, deep internals, high scale' },
  { id: 'mixed', label: 'Mixed Difficulty', description: 'Starts with fundamentals, progresses to senior architectural problem solving' },
] as const;

export const DURATION_OPTIONS = [
  { value: 30, label: '30 Minutes', questionsTarget: 4 },
  { value: 45, label: '45 Minutes', questionsTarget: 6 },
  { value: 60, label: '60 Minutes (Standard)', questionsTarget: 8 },
  { value: 90, label: '90 Minutes (Comprehensive)', questionsTarget: 11 },
] as const;

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', badge: 'Ultra Fast (1s) • Highly Reliable' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: 'Balanced • High Depth' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Experimental • High Demand' },
] as const;

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export const FALLBACK_MODEL_CHAIN: readonly string[] = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

export const DSA_LANGUAGES = [
  { id: 'java', name: 'Java', template: 'class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}' },
  { id: 'python', name: 'Python', template: 'def solution():\n    # Your code here\n    pass' },
  { id: 'javascript', name: 'JavaScript', template: 'function solution() {\n    // Your code here\n}' },
  { id: 'cpp', name: 'C++', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}' },
] as const;

export const HIRING_RECOMMENDATIONS = [
  { value: 'Strong Hire', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'Hire', color: 'cyan', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { value: 'Lean Hire', color: 'blue', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'Lean No Hire', color: 'amber', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'No Hire', color: 'rose', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
] as const;

