import type { Question, DsaProblem, DsaReview } from '@/types';
import type { AIReportResult } from './AIProvider';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'mock_q_1',
    number: 1,
    category: 'Candidate Introduction',
    topic: 'Professional Overview',
    difficulty: 'Easy',
    title: 'Professional Experience & Backend Walkthrough',
    question:
      'Tell me about yourself and walk me through your professional experience, particularly your experience with backend development.',
    expectedAnswer:
      'Candidate provides a structured walkthrough of recent backend engineering roles, focusing on Java/Spring microservices, distributed systems, high throughput workloads handled, and notable system design or production achievements.',
    evaluationPoints: [
      'Clarity, conciseness, and structure of technical communication',
      'Relevance of enterprise Java and backend architecture experience',
      'Ownership of services from design to production monitoring',
    ],
    commonMistakes: [
      'Listing resume bullet points chronologically without technical depth',
      'Failing to mention scale, metrics, or technical challenges',
    ],
    redFlags: [
      'Cannot explain the high-level architecture of their own recent projects',
      'Ambiguity regarding their specific contributions versus team accomplishments',
    ],
    followUpQuestions: [
      'What was the most critical production incident you diagnosed and resolved?',
      'How did your team handle database migrations with zero downtime?',
    ],
    suggestedTimeMinutes: 5,
    evaluationRubric: 'Score based on technical depth, articulate communication, and practical backend ownership.',
    maxScore: 10,
  },
  {
    id: 'mock_q_2',
    number: 2,
    category: 'Distributed Systems & Messaging',
    topic: 'Kafka and Distributed Messaging',
    difficulty: 'Hard',
    title: 'Kafka Consumer Crash & Exactly-Once Semantics',
    question:
      'Your Kafka consumer processes a payment event, executes a database debit transaction, but the application crashes immediately before committing the Kafka offset. When the service restarts, the consumer re-reads the exact same offset. How would you architect this to prevent duplicate payment processing?',
    expectedAnswer:
      'Candidate explains idempotency strategies: utilizing an Idempotent Consumer pattern with unique transaction/event IDs stored with database unique constraints; transactional outbox pattern; or Kafka transactional producer with read_committed isolation level combined with database deduplication table.',
    evaluationPoints: [
      'Distinction between at-least-once, at-most-once, and effectively-once delivery',
      'Implementation of idempotency keys in relational database transactions',
      'Knowledge of Kafka transaction coordinator, producer idempotence, and commit semantics',
    ],
    commonMistakes: [
      'Suggesting auto-commit with offset commits before processing (causes message loss)',
      'Assuming distributed transactions (2PC/XA) are standard or resilient in Kafka',
    ],
    redFlags: [
      'Not recognizing that Kafka offset commit failures lead to duplicate consumption',
      'Relying solely on in-memory deduplication in a multi-instance microservice environment',
    ],
    followUpQuestions: [
      'How does consumer group rebalancing affect in-flight transactions?',
      'How would you handle poisoned pill messages that repeatedly crash the consumer?',
    ],
    suggestedTimeMinutes: 8,
    evaluationRubric: 'Full marks for transactional outbox/dedup table with database ACID constraints.',
    maxScore: 10,
  },
  {
    id: 'mock_q_3',
    number: 3,
    category: 'Spring Framework',
    topic: 'Spring Boot & Transactions',
    difficulty: 'Hard',
    title: 'Spring @Transactional Proxy Traps & Propagation',
    question:
      'In a Spring Boot service bean, methodA() is annotated with @Transactional. Within the same class, methodA() calls methodB(), which is annotated with @Transactional(propagation = Propagation.REQUIRES_NEW). If methodB() throws a RuntimeException, will methodA() catch it? Does methodB() run in an isolated transaction? Explain why, considering Spring AOP dynamic proxies.',
    expectedAnswer:
      'Because methodB() is called internally (this.methodB()) rather than through the Spring proxy, Spring AOP transaction interceptors are bypassed. Thus, methodB runs in methodA’s existing transaction rather than starting a new physical transaction. If methodB throws an unhandled RuntimeException, the entire transaction is marked rollback-only.',
    evaluationPoints: [
      'Deep understanding of Spring dynamic proxies (JDK dynamic proxy vs CGLIB)',
      'Understanding of self-invocation limitation in Spring AOP',
      'Transaction propagation behaviors (REQUIRED vs REQUIRES_NEW)',
      'Remediation techniques (self-injection, separating into a dedicated service, or TransactionTemplate)',
    ],
    commonMistakes: [
      'Believing REQUIRES_NEW creates a new transaction during internal method calls',
      'Failing to understand why the proxy is bypassed when invoking `this.method()`',
    ],
    redFlags: [
      'Assuming Spring annotations work via bytecode manipulation without understanding proxying',
      'Cannot explain the difference between checked and unchecked exception rollback defaults in Spring',
    ],
    followUpQuestions: [
      'How does AspectJ compile-time or load-time weaving overcome this limitation?',
      'How does TransactionTemplate differ from declarative @Transactional?',
    ],
    suggestedTimeMinutes: 7,
    evaluationRubric: 'Evaluate knowledge of Spring AOP proxy mechanisms and transaction propagation.',
    maxScore: 10,
  },
  {
    id: 'mock_q_4',
    number: 4,
    category: 'Core Java & Concurrency',
    topic: 'Java Concurrency & Collections Internals',
    difficulty: 'Hard',
    title: 'ConcurrentHashMap Internals & Lock Striping',
    question:
      'Explain the internal architecture of ConcurrentHashMap in Java 8+. How does it achieve thread safety without locking the entire map? Contrast its CAS and synchronized node locking with Java 7 Segment lock striping, and explain how hash collision treeification (Red-Black Trees) functions concurrently.',
    expectedAnswer:
      'Java 8 discarded Segments in favor of an array of Node bins. Reads (get) are completely lock-free using volatile head pointers. Writes (put) use CAS (Compare-And-Swap) for null buckets, and fine-grained synchronized locking on the individual head node of a populated bucket. When a bucket exceeds TREEIFY_THRESHOLD (8 nodes) and capacity >= 64, it transforms into a TreeNode (Red-Black Tree). Concurrent resizes utilize forward-pointing ForwardingNodes to coordinate multi-threaded rehashing.',
    evaluationPoints: [
      'Knowledge of CAS (Unsafe / VarHandle) operations in Java',
      'Volatile read visibility without locks',
      'Head-node locking granularity vs Java 7 Segment locks',
      'Treeification threshold (8) and un-treeify threshold (6)',
    ],
    commonMistakes: [
      'Stating that ConcurrentHashMap still uses 16 Segments with ReentrantLock',
      'Thinking get() requires synchronization',
    ],
    redFlags: [
      'Confusing ConcurrentHashMap with Collections.synchronizedMap() or Hashtable',
      'Unfamiliarity with volatile memory visibility semantics',
    ],
    followUpQuestions: [
      'How does size() work concurrently in Java 8 ConcurrentHashMap using LongAdder counters?',
      'Why does ConcurrentHashMap disallow null keys and null values?',
    ],
    suggestedTimeMinutes: 8,
    evaluationRubric: 'Evaluate precision regarding CAS, volatile reads, and fine-grained bucket synchronization.',
    maxScore: 10,
  },
  {
    id: 'mock_q_5',
    number: 5,
    category: 'JVM & Performance',
    topic: 'JVM and Memory Management',
    difficulty: 'Hard',
    title: 'Diagnosing Production OutOfMemoryError and ThreadLocal Leaks',
    question:
      'Your production Spring Boot microservice running on Kubernetes begins throwing java.lang.OutOfMemoryError: Metaspace, followed by worker threads deadlocking due to ThreadLocal memory leaks across an ExecutorService thread pool. Walk through your systematic troubleshooting workflow, tools, heap dump flags, and permanent code fixes.',
    expectedAnswer:
      'Metaspace exhaustion: caused by classloader leaks (e.g. dynamic class generation via CGLIB, reflection, or unreleased frameworks). Check -XX:MaxMetaspaceSize and use jcmd VM.classloader_stats or heap dump analyzer. For ThreadLocal leaks in thread pools: worker threads are reused indefinitely, retaining ThreadLocal values in Thread.threadLocals map. Remediation requires explicit try-finally threadLocal.remove() or custom ThreadPoolTaskDecorator / clean context filters.',
    evaluationPoints: [
      'Distinction between Java Heap space and Metaspace / native memory',
      'Understanding of ThreadLocal lifecycle when coupled with pooled threads',
      'Usage of heap analysis tools (Eclipse MAT, async-profiler, jcmd, VisualVM)',
      'Production JVM flags (-XX:+HeapDumpOnOutOfMemoryError, -XX:HeapDumpPath)',
    ],
    commonMistakes: [
      'Increasing -Xmx to fix a Metaspace OOM error',
      'Forgetting that ThreadLocal values persist across tasks unless explicitly removed',
    ],
    redFlags: [
      'Assuming garbage collection automatically cleans up ThreadLocals in worker thread pools',
      'Inability to specify any JVM diagnosis tools or memory dump flags',
    ],
    followUpQuestions: [
      'How do Java 21 Virtual Threads change the trade-offs and risks of ThreadLocal usage?',
      'What is ScopedValue in modern Java and why was it introduced?',
    ],
    suggestedTimeMinutes: 8,
    evaluationRubric: 'Strong answers demonstrate real-world production incident response and memory profiling.',
    maxScore: 10,
  },
  {
    id: 'mock_q_6',
    number: 6,
    category: 'Database & Storage',
    topic: 'MySQL and Database Optimization',
    difficulty: 'Hard',
    title: 'High-Concurrency Inventory Deduction & Deadlock Resolution',
    question:
      'During a flash-sale event, 5,000 requests/sec attempt to decrement the inventory of a limited product in MySQL (InnoDB). Concurrent transactions execute: SELECT quantity FROM inventory WHERE product_id = ? FOR UPDATE; followed by UPDATE inventory SET quantity = quantity - 1. You observe severe lock contention and MySQL deadlock errors. How would you redesign this database interaction and architecture?',
    expectedAnswer:
      'Candidate discusses: 1) Atomic single-statement updates: UPDATE inventory SET quantity = quantity - 1 WHERE product_id = ? AND quantity >= 1; 2) Optimistic locking with version column; 3) Inventory sharding / slotting across multiple rows; 4) Redis Lua script / distributed lock (Redlock) or in-memory decrement with asynchronous write-behind; 5) Consistent lock ordering across multi-item transactions to eliminate deadlocks.',
    evaluationPoints: [
      'Understanding InnoDB row-level locking vs next-key locking',
      'Elimination of SELECT FOR UPDATE through conditional atomic UPDATEs',
      'Caching and offloading hotspot counters to Redis with atomic Lua scripting',
      'Asynchronous batching and reconciliation architectures',
    ],
    commonMistakes: [
      'Recommending application-level synchronized blocks (useless in multi-node clusters)',
      'Relying on repeatable read isolation level without understanding write lock behavior',
    ],
    redFlags: [
      'Not knowing how deadlocks occur in relational databases',
      'Proposing solutions that create race conditions with overselling',
    ],
    followUpQuestions: [
      'How does MySQL EXPLAIN analyze composite indexes, and what is an index condition pushdown (ICP)?',
      'What are the trade-offs between pessimistic and optimistic locking under high write contention?',
    ],
    suggestedTimeMinutes: 7,
    evaluationRubric: 'Evaluate grasp of relational locking, concurrency limits, and distributed cache architectures.',
    maxScore: 10,
  },
];

export const MOCK_DSA_PROBLEMS: DsaProblem[] = [
  {
    id: 'mock_dsa_1',
    number: 1,
    title: 'Design an In-Memory LRU Cache with Expiration (TTL)',
    description:
      'Design and implement a thread-safe or optimal Least Recently Used (LRU) Cache that supports `get(key)`, `put(key, value, ttlMs)`, and automatic eviction of least recently used items when capacity is exceeded, as well as lazy eviction of expired keys.',
    inputFormat: 'Operations sequence with keys, values, and capacity',
    outputFormat: 'Return values from get() and state reflections',
    constraints: [
      'Capacity: 1 <= capacity <= 10^4',
      'Keys and values are alphanumeric strings or integers',
      'All get and put operations should operate in O(1) average time complexity',
    ],
    sampleInputs: [
      'LRUCache(2)',
      'put("A", 1, 1000)',
      'put("B", 2, 1000)',
      'get("A") -> returns 1',
      'put("C", 3, 1000) -> evicts "B"',
      'get("B") -> returns -1 (not found)',
    ],
    sampleOutputs: ['[null, null, null, 1, null, -1]'],
    expectedApproach:
      'Doubly Linked List + HashMap combination for O(1) eviction and lookup, with node timestamps for TTL checks on access.',
    expectedTimeComplexity: 'O(1) for both get and put',
    expectedSpaceComplexity: 'O(capacity)',
    edgeCases: [
      'Capacity of 1',
      'Overwriting existing key with new value or TTL',
      'Expired items accessed before LRU eviction',
      'Null keys or negative TTL values',
    ],
    suggestedTimeMinutes: 15,
  },
  {
    id: 'mock_dsa_2',
    number: 2,
    title: 'Merge K Sorted Event Timestamps Stream',
    description:
      'You are aggregating financial payment log streams from K different microservices. Each microservice produces an array of sorted 64-bit millisecond event timestamps. Return a single flattened array containing all timestamps in non-decreasing order.',
    inputFormat: 'List of K sorted integer arrays: timestamps[K][N]',
    outputFormat: 'Single sorted 1D array containing all elements',
    constraints: [
      '0 <= K <= 10^4',
      '0 <= total elements <= 10^6',
      '-10^12 <= timestamp <= 10^12',
    ],
    sampleInputs: ['[[1, 4, 7], [2, 5, 8], [3, 6, 9]]'],
    sampleOutputs: ['[1, 2, 3, 4, 5, 6, 7, 8, 9]'],
    expectedApproach:
      'Min-Heap (PriorityQueue) of size K containing an entry representing (value, streamIndex, elementIndex) or Divide and Conquer merge.',
    expectedTimeComplexity: 'O(N log K) where N is total number of timestamps',
    expectedSpaceComplexity: 'O(K) auxiliary space for the Min-Heap',
    edgeCases: [
      'Empty outer list or lists containing empty streams',
      'Streams of drastically unequal lengths',
      'Duplicate timestamps across different streams',
    ],
    suggestedTimeMinutes: 15,
  },
];

export const MOCK_DSA_REVIEW: DsaReview = {
  logicalCorrectnessScore: 32,
  algorithmSelectionScore: 19,
  timeComplexityScore: 14,
  spaceComplexityScore: 9,
  edgeCaseHandlingScore: 9,
  codeQualityScore: 9,
  overallScore100: 92,
  overallScore5: 4.6,
  interviewerAdjustedScore: 92,
  detailedEvaluation:
    'The candidate implemented the classic Doubly-Linked List + Hash Map pattern cleanly. Hash lookups and node updates run in strict O(1) time. The dummy head and tail sentinel nodes effectively eliminate null-pointer checks during node splicing. Lazy timestamp TTL eviction was integrated directly into the get() lookup pathway.',
  potentialLogicalErrors: [
    'Static analysis note: If capacity is 0 or negative during initialization, bounds checks are omitted in constructor.',
  ],
  missingEdgeCases: [
    'Updating an existing key whose TTL expired right before the update.',
  ],
  complexityAnalysis:
    'Time Complexity: Strict O(1) amortized for both get and put operations. Space Complexity: O(capacity) auxiliary memory for HashMap pointers and linked list nodes.',
  alternativeOptimalApproach:
    'In Java, java.util.LinkedHashMap with removeEldestEntry override provides a standard library shorthand, though writing the doubly linked list manually proves fundamental data structure mastery.',
  improvementSuggestions: [
    'Add synchronized blocks or ReentrantReadWriteLock if multi-threaded access is anticipated.',
    'Use primitive long instead of Long wrappers to avoid unnecessary JVM object boxing overhead.',
  ],
  interviewerSummary:
    'Strong algorithmic mastery. Clean code structure, optimal O(1) time complexity, and solid boundary checks.',
};

export const MOCK_REPORT_RESULT: AIReportResult = {
  candidateOverview:
    'The candidate demonstrated impressive technical depth, practical systems knowledge, and articulate problem-solving capabilities throughout the technical interview. Their grasp of enterprise Java concurrency, Spring transactional boundary mechanics, and distributed message processing in Kafka is well-aligned with senior engineering expectations.',
  competencies: {
    java: {
      score: 88,
      level: 'Proficient',
      notes: 'Deep understanding of JVM memory layout, ConcurrentHashMap CAS mechanics, and modern Java 17/21 concurrency constructs.',
    },
    springBootMicroservices: {
      score: 85,
      level: 'Proficient',
      notes: 'Accurately articulated Spring AOP proxy self-invocation limitations and transactional propagation behavior.',
    },
    kafka: {
      score: 82,
      level: 'Proficient',
      notes: 'Demonstrated solid understanding of at-least-once delivery trade-offs, consumer offset commits, and the transactional outbox pattern.',
    },
    mySql: {
      score: 78,
      level: 'Proficient',
      notes: 'Knowledgeable regarding InnoDB row-level locking, deadlock prevention, and moving high-frequency counter updates to Redis.',
    },
    systemDesign: {
      score: 84,
      level: 'Proficient',
      notes: 'Strong instincts regarding high availability, horizontal scaling, caching strategies, and circuit breaking.',
    },
    designPatterns: {
      score: 80,
      level: 'Proficient',
      notes: 'Appropriately selected patterns (Strategy, Factory, Outbox, Sentinel Nodes) without over-engineering.',
    },
    realWorldProblemSolving: {
      score: 86,
      level: 'Proficient',
      notes: 'Methodical approach to production incident diagnosis, heap dump inspection, and thread pool leak resolution.',
    },
    dsa: {
      score: 88,
      level: 'Proficient',
      notes: 'Delivered an optimal O(1) LRU Cache and O(N log K) stream merger with clean code style and good edge-case reasoning.',
    },
  },
  technicalStrengths: [
    'Mastery of core Java concurrency and lock-free data structures (CAS, ConcurrentHashMap internals).',
    'Comprehensive real-world understanding of Spring AOP proxy mechanisms and transaction propagation.',
    'Practical, resilient distributed systems thinking (idempotency, outbox pattern, deadlocks).',
    'Clean, idiomatic code syntax with thoughtful time/space complexity optimization.',
  ],
  technicalWeaknesses: [
    'Could expand depth regarding advanced Kubernetes-native JVM garbage collector tuning (e.g. ZGC generational tuning).',
    'Slightly hesitant on database index condition pushdown (ICP) details in MySQL 8.',
  ],
  areasForImprovement: [
    'Familiarity with modern Java Virtual Threads (Project Loom) trade-offs with ThreadLocal memory retention.',
    'Deep dive into Kafka partition rebalance protocol and cooperative sticky assignors.',
  ],
  practicalEngineeringCompetency:
    'The candidate is production-ready for a Senior Java Backend Engineer role. They prioritize system reliability, idempotency, and clean maintainability over naive textbook answers.',
  dsaSummary:
    'Excellent data structure selection and implementation. Handled edge cases systematically with optimal O(1) and O(N log K) time complexities.',
  hiringRecommendation: 'Hire',
  recommendationRationale:
    'Solid technical fundamentals, robust production problem-solving mindset, and strong coding capability across all evaluated backend competencies.',
};
