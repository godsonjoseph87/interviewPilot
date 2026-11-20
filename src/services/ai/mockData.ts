import type { Question, DsaProblem, DsaReview, ContextualAlternative } from '@/types';
import type { AIReportResult, GenerateCustomQuestionParams } from './AIProvider';

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
    detailedExplanation: `### Problem Overview & Intuition
The candidate must implement a Least Recently Used (LRU) Cache supporting Time-to-Live (TTL). 

### Key Algorithmic Concepts:
1. **Doubly Linked List + HashMap**: A standard HashMap provides O(1) key-value lookup. A Doubly Linked List maintains access ordering where the Head represents Most Recently Used (MRU) and the Tail represents Least Recently Used (LRU).
2. **TTL Expiration Handling**: Store an expiry timestamp (\`System.currentTimeMillis() + ttlMs\`) inside each Node. On \`get(key)\`, check if \`now > node.expiryTime\`. If expired, remove the node and return -1.
3. **Eviction on Put**: When capacity is reached and a new key is added, evict the node immediately before the tail sentinel (\`tail.prev\`), and remove its key from the HashMap.

### What to Look For in Candidate's Solution:
- Clear separation of Node structure with prev/next pointers.
- Correct maintenance of sentinel dummy head and tail to avoid null-pointer edge cases.
- Thread-safety awareness if synchronized or ConcurrentHashMap with ReentrantLock is mentioned.`,
    workingCode: `import java.util.HashMap;
import java.util.Map;

public class LRUCacheWithTTL {
    static class Node {
        String key;
        int value;
        long expiryTime;
        Node prev, next;

        Node(String key, int value, long ttlMs) {
            this.key = key;
            this.value = value;
            this.expiryTime = System.currentTimeMillis() + ttlMs;
        }

        boolean isExpired() {
            return System.currentTimeMillis() > expiryTime;
        }
    }

    private final int capacity;
    private final Map<String, Node> map;
    private final Node head, tail;

    public LRUCacheWithTTL(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        this.head = new Node("", 0, Long.MAX_VALUE);
        this.tail = new Node("", 0, Long.MAX_VALUE);
        head.next = tail;
        tail.prev = head;
    }

    public synchronized int get(String key) {
        Node node = map.get(key);
        if (node == null) return -1;
        if (node.isExpired()) {
            removeNode(node);
            map.remove(key);
            return -1;
        }
        moveToHead(node);
        return node.value;
    }

    public synchronized void put(String key, int value, long ttlMs) {
        if (map.containsKey(key)) {
            Node existing = map.get(key);
            existing.value = value;
            existing.expiryTime = System.currentTimeMillis() + ttlMs;
            moveToHead(existing);
            return;
        }

        if (map.size() >= capacity) {
            Node lru = tail.prev;
            removeNode(lru);
            map.remove(lru.key);
        }

        Node newNode = new Node(key, value, ttlMs);
        addNodeToHead(newNode);
        map.put(key, newNode);
    }

    private void addNodeToHead(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void moveToHead(Node node) {
        removeNode(node);
        addNodeToHead(node);
    }
}`,
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
    detailedExplanation: `### Problem Overview & Intuition
The candidate must merge K pre-sorted streams of timestamps efficiently. This is the exact algorithmic primitive behind distributed log aggregators and multi-partition stream consumption.

### Optimal Approach (Min-Heap):
1. **Initialize Min-Heap**: Insert the first element of each non-empty stream into a PriorityQueue sized at most K. Each entry stores \`{ value, streamIndex, elementIndex }\`.
2. **Extract Minimum**: Poll the smallest timestamp from the PriorityQueue, add it to the output array.
3. **Advance Pointer**: If the stream that yielded the minimum still has elements, insert its next element (\`elementIndex + 1\`) into the heap.
4. **Repeat**: Continue until the heap is empty.

### Complexity Analysis:
- **Time Complexity**: \`O(N log K)\`, where N is the total number of timestamps across all streams. Each insertion and removal in a heap of size K takes \`O(log K)\`.
- **Space Complexity**: \`O(K)\` auxiliary space for the PriorityQueue.

### Traps & Candidate Clues:
- Inefficient approach: Flattening everything and doing \`Arrays.sort()\` takes \`O(N log N)\` and fails to exploit the existing sorted property.
- Pairing merge (Divide and Conquer) is an acceptable alternative with \`O(N log K)\` time.`,
    workingCode: `import java.util.PriorityQueue;
import java.util.List;
import java.util.ArrayList;

public class MergeKSortedStreams {
    static class StreamPointer implements Comparable<StreamPointer> {
        long value;
        int streamIdx;
        int elementIdx;

        StreamPointer(long value, int streamIdx, int elementIdx) {
            this.value = value;
            this.streamIdx = streamIdx;
            this.elementIdx = elementIdx;
        }

        @Override
        public int compareTo(StreamPointer other) {
            return Long.compare(this.value, other.value);
        }
    }

    public static List<Long> mergeKStreams(List<List<Long>> streams) {
        List<Long> result = new ArrayList<>();
        if (streams == null || streams.isEmpty()) return result;

        PriorityQueue<StreamPointer> minHeap = new PriorityQueue<>();

        // Initialize heap with first element from each non-empty stream
        for (int i = 0; i < streams.size(); i++) {
            List<Long> stream = streams.get(i);
            if (stream != null && !stream.isEmpty()) {
                minHeap.offer(new StreamPointer(stream.get(0), i, 0));
            }
        }

        // Pull minimum and advance pointer in that stream
        while (!minHeap.isEmpty()) {
            StreamPointer current = minHeap.poll();
            result.add(current.value);

            int nextElemIdx = current.elementIdx + 1;
            List<Long> sourceStream = streams.get(current.streamIdx);
            if (nextElemIdx < sourceStream.size()) {
                minHeap.offer(new StreamPointer(sourceStream.get(nextElemIdx), current.streamIdx, nextElemIdx));
            }
        }

        return result;
    }
}`,
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

export const MOCK_EXTRACTED_CONTEXT = {
  domain: 'E-commerce & Distributed Order Processing',
  technologies: ['Java 17', 'Spring Boot', 'Apache Kafka', 'Hibernate / JPA', 'MySQL', 'Redis'],
  architecture: ['Microservices', 'Event-Driven Architecture', 'CQRS', 'Hexagonal Architecture'],
  communication: ['Asynchronous Event Streaming (Kafka)', 'Synchronous REST with Circuit Breakers'],
  businessCapabilities: [
    'Product Catalog & Inventory Reservation',
    'Shopping Cart & Checkout Pipeline',
    'Order Lifecycle Management',
    'Payment Gateway Integration',
  ],
  potentialScenarios: [
    'Concurrent checkout during flash sales depleting single stock unit',
    'Kafka consumer crash during payment event before offset commit',
    'Inventory reservation compensation after downstream payment failure',
    'Deadlock during concurrent batch updates to MySQL inventory table',
    'Redis cache stampede during sudden product price drop events',
  ],
  clarificationProbes: [
    'Was inventory reserved synchronously during checkout or asynchronously upon order placement?',
    'What isolation level was configured on MySQL during inventory decrement transactions?',
    'How did the service handle duplicate events in the Kafka consumer group?',
  ],
};

export function generateMockContextualAlternatives(
  upcomingQuestions: Question[],
  contextText: string,
  sessionId: string
) {
  const isEcommerce =
    /shop|order|cart|inventory|payment|ecommerce|product|checkout/i.test(contextText);
  const isKafka = /kafka|event|stream|queue|topic|consumer/i.test(contextText);

  return upcomingQuestions.slice(0, 3).map((q, index) => {
    let contextualTitle = `Real-World Scenario: ${q.topic} in Production`;
    let contextualQuestion = q.question;
    let reason = 'Reframed question using candidate project domain.';
    let projectContextUsed = isEcommerce
      ? 'Online shopping platform with microservices & asynchronous order pipeline'
      : 'High-throughput enterprise backend services';

    if (q.category.includes('Distributed') || q.topic.includes('Kafka') || isKafka) {
      contextualTitle = 'Flash Sale Kafka Consumer Crash & Idempotent Processing';
      contextualQuestion =
        'During a flash sale, your shopping application receives thousands of order events per second. You use Kafka to process these events asynchronously. What happens if a consumer crashes after processing an order debit but before committing its offset, and how do you ensure zero duplicate orders or inventory inconsistencies?';
      reason =
        'Connects theoretical Kafka consumer offset commits to candidate stated experience with asynchronous order events.';
      projectContextUsed = 'Kafka event streaming in high-throughput order processing';
    } else if (q.category.includes('Concurrency') || q.topic.includes('Concurrency')) {
      contextualTitle = 'Concurrent Product Purchases & Inventory Overselling Prevention';
      contextualQuestion =
        'In your e-commerce application, two customers simultaneously submit checkout requests for the final available product in inventory. How would you handle this concurrency in Java and Spring Boot to strictly prevent overselling while maintaining high checkout throughput?';
      reason =
        'Tests thread safety, race conditions, and distributed locking against real-world inventory depletion.';
      projectContextUsed = 'E-commerce inventory management and high-concurrency checkout';
    } else if (q.category.includes('Spring') || q.topic.includes('Spring')) {
      contextualTitle = 'Distributed Sagas & Compensation in Order Services';
      contextualQuestion =
        'In your Spring Boot microservices setup, an order is created and inventory is reserved, but the payment gateway transaction subsequently fails. How did you architect the rollback and compensation flow across your microservices to restore data consistency?';
      reason =
        'Applies Spring transaction management and resilience patterns to candidate microservices architecture.';
      projectContextUsed = 'Spring Boot microservices order and payment coordination';
    } else {
      contextualTitle = `Production Case Study: ${q.title}`;
      contextualQuestion = `Applying your experience with backend services, how would you address ${q.title.toLowerCase()} when operating under strict SLA constraints and high availability requirements?`;
    }

    return {
      id: `alt_${q.id}_${Date.now()}_${index}`,
      sessionId,
      originalQuestionId: q.id,
      title: contextualTitle,
      question: contextualQuestion,
      category: q.category,
      difficulty: q.difficulty,
      projectContextUsed,
      reasonForAdaptation: reason,
      expectedAnswer: `Candidate applies principles of ${q.topic} directly to the candidate's project context. Identifies trade-offs between consistency and latency, explains concrete implementation mechanics (e.g. idempotency keys, distributed locks, isolation levels), and addresses failure modes.`,
      evaluationPoints: [
        `Direct application of ${q.topic} to candidate's stated domain`,
        'Thorough explanation of failure detection, edge cases, and recovery',
        'Demonstrates practical production engineering awareness rather than memorized theory',
      ],
      commonMistakes: [
        'Focusing only on the happy path without handling network partitions or service crashes',
        'Over-engineering with distributed locks when optimistic locking or atomic database operations suffice',
      ],
      redFlags: [
        'Unaware of race conditions when multiple consumers or threads access shared state',
        'Suggesting non-transactional rollback mechanisms that leave system in an inconsistent state',
      ],
      followUpQuestions: [
        'How would you monitor and alert on this in your production observability dashboards?',
        'What metrics would indicate that your solution is degrading under 5x peak load?',
      ],
      suggestedTimeMinutes: q.suggestedTimeMinutes || 5,
      evaluationRubric: `Evaluate depth of practical implementation, concurrency guarantees, and system resilience in ${projectContextUsed}.`,
      competency: q.topic,
    };
  });
}

export function generateMockCopilotProbes(latestContext: string, sessionId: string) {
  const isKafka = /kafka|stream|event|offset|consumer/i.test(latestContext);
  const isDb = /sql|mysql|postgres|hibernate|db|database|transaction/i.test(latestContext);
  const isMicro = /service|api|rest|spring|http/i.test(latestContext);

  if (isKafka) {
    return [
      {
        id: `probe_${Date.now()}_1`,
        sessionId,
        category: 'Reliability' as const,
        probeQuestion:
          'What happens if the consumer processes an order event successfully but crashes before committing the offset? How did your project prevent duplicate business operations?',
        rationale: 'Verifies understanding of at-least-once message delivery and consumer-side idempotency.',
        timestamp: Date.now(),
      },
      {
        id: `probe_${Date.now()}_2`,
        sessionId,
        category: 'Data Consistency' as const,
        probeQuestion:
          'How do you guarantee that your local database write and Kafka message publication either both succeed or both fail together?',
        rationale: 'Tests candidate knowledge of the Transactional Outbox Pattern or 2PC vs dual-write vulnerabilities.',
        timestamp: Date.now(),
      },
      {
        id: `probe_${Date.now()}_3`,
        sessionId,
        category: 'Performance' as const,
        probeQuestion:
          'How would you detect and resolve a sudden surge in Kafka consumer lag without losing message order within partitions?',
        rationale: 'Evaluates production monitoring signals, partition rebalancing, and horizontal scaling limits.',
        timestamp: Date.now(),
      },
      {
        id: `probe_${Date.now()}_4`,
        sessionId,
        category: 'Practical Implementation' as const,
        probeQuestion:
          'How did your team handle poison-pill messages and dead-letter queues in production? Did you have an automated replay mechanism?',
        rationale: 'Reveals genuine hands-on experience with production incident handling and error quarantine.',
        timestamp: Date.now(),
      },
    ];
  }

  if (isDb) {
    return [
      {
        id: `probe_${Date.now()}_1`,
        sessionId,
        category: 'Data Consistency' as const,
        probeQuestion:
          'Would you choose optimistic locking or pessimistic locking for the inventory decrement transaction, and why?',
        rationale: 'Evaluates trade-off between lock contention under high write volume vs retry overhead.',
        timestamp: Date.now(),
      },
      {
        id: `probe_${Date.now()}_2`,
        sessionId,
        category: 'Reliability' as const,
        probeQuestion:
          'What MySQL isolation level was running, and did you encounter phantom reads or deadlock exceptions during concurrent batch updates?',
        rationale: 'Probes deep relational database mechanics and deadlock mitigation strategies.',
        timestamp: Date.now(),
      },
      {
        id: `probe_${Date.now()}_3`,
        sessionId,
        category: 'Performance' as const,
        probeQuestion:
          'How did you identify slow queries and design composite indexes to avoid filesort and temporary table creation on disk?',
        rationale: 'Tests execution plan analysis (EXPLAIN), B-Tree indexing, and query optimization skills.',
        timestamp: Date.now(),
      },
      {
        id: `probe_${Date.now()}_4`,
        sessionId,
        category: 'Practical Implementation' as const,
        probeQuestion:
          'How did you handle database schema migrations in production with zero downtime for high-traffic tables?',
        rationale: 'Checks practical engineering maturity with tools like Liquibase/Flyway or gh-ost/pt-online-schema-change.',
        timestamp: Date.now(),
      },
    ];
  }

  return [
    {
      id: `probe_${Date.now()}_1`,
      sessionId,
      category: 'Reliability' as const,
      probeQuestion:
        'What circuit breaking and fallback mechanisms were configured if downstream services experienced high latency or degraded availability?',
      rationale: 'Tests fault isolation and cascading failure prevention (Resilience4j / Envoy).',
      timestamp: Date.now(),
    },
    {
      id: `probe_${Date.now()}_2`,
      sessionId,
      category: 'Data Consistency' as const,
      probeQuestion:
        'When an operation spans multiple microservices, how do you verify eventual consistency, and how do you reconcile orphaned state?',
      rationale: 'Examines distributed saga patterns and reconciliation jobs.',
      timestamp: Date.now(),
    },
    {
      id: `probe_${Date.now()}_3`,
      sessionId,
      category: 'Performance' as const,
      probeQuestion:
        'What were the P99 latency SLAs for these critical endpoints, and what was the primary bottleneck diagnosed during load testing?',
      rationale: 'Validates quantitative engineering discipline and profiling familiarity.',
      timestamp: Date.now(),
    },
    {
      id: `probe_${Date.now()}_4`,
      sessionId,
      category: 'Practical Implementation' as const,
      probeQuestion:
        'Walk me through the most challenging production bug or outage you personally resolved in this architecture. What was the root cause?',
      rationale: 'Distinguishes genuine architectural involvement from superficial theoretical claims.',
      timestamp: Date.now(),
    },
  ];
}

export const MOCK_DSA_ALTERNATIVE_POOL: DsaProblem[] = [
  {
    id: 'alt_dsa_1',
    number: 1,
    title: 'Sliding Window Maximum in High-Frequency Transaction Streams',
    description:
      'Given an array of integers `nums` representing real-time transaction amounts and an integer window size `k`, return the maximum transaction amount in each sliding window of size `k` as the window moves from left to right.',
    inputFormat: 'Array of integers `nums` and integer `k`',
    outputFormat: 'Array of maximum values for each window position',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
      '1 <= k <= nums.length',
    ],
    sampleInputs: ['nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3'],
    sampleOutputs: ['[3, 3, 5, 5, 6, 7]'],
    expectedApproach:
      'Monotonic Deque storing indices in decreasing order of their corresponding values, achieving O(N) linear time.',
    expectedTimeComplexity: 'O(N) where N is the length of nums',
    expectedSpaceComplexity: 'O(k) auxiliary space for the deque',
    edgeCases: ['k = 1 (every element is max)', 'k = nums.length (single maximum)', 'All elements identical or strictly decreasing'],
    suggestedTimeMinutes: 15,
    detailedExplanation: `### Algorithmic Concept & Intuition:
A naive solution recalculates the maximum for every window in O(N * k), which TLEs for N = 10^5 and k = 10^4.
The optimal approach maintains a **Monotonic Decreasing Deque** storing array indices.
1. Before adding index \`i\`, pop elements from the back of the deque that are smaller than \`nums[i]\` since they can never be the maximum in any future window.
2. Evict elements from the front of the deque if their index is out of the current window (\`deque.peekFirst() < i - k + 1\`).
3. The front of the deque (\`deque.peekFirst()\`) always stores the index of the maximum element for the current window.`,
    workingCode: `import java.util.ArrayDeque;
import java.util.Deque;

public class SlidingWindowMaximum {
    public static int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0 || k <= 0) return new int[0];
        int n = nums.length;
        int[] result = new int[n - k + 1];
        Deque<Integer> deque = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            // Remove indices outside the current window
            while (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
                deque.pollFirst();
            }
            // Remove elements smaller than current element from back
            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) {
                deque.pollLast();
            }
            deque.offerLast(i);

            // Record maximum once first window is formed
            if (i >= k - 1) {
                result[i - k + 1] = nums[deque.peekFirst()];
            }
        }
        return result;
    }
}`,
  },
  {
    id: 'alt_dsa_2',
    number: 2,
    title: 'Find Continuous Median in Streaming Financial Transactions',
    description:
      'Design a data structure that supports receiving a continuous stream of integer transaction amounts and computing the median value in real-time in O(1) time.',
    inputFormat: 'Operations sequence of `addNum(int num)` and `findMedian()`',
    outputFormat: 'Double representing current median after operations',
    constraints: [
      '-10^5 <= num <= 10^5',
      'At most 5 * 10^4 calls will be made to addNum and findMedian',
    ],
    sampleInputs: ['addNum(1)', 'addNum(2)', 'findMedian() -> 1.5', 'addNum(3)', 'findMedian() -> 2.0'],
    sampleOutputs: ['[null, null, 1.5, null, 2.0]'],
    expectedApproach:
      'Two Heaps: A Max-Heap for the lower half of values and a Min-Heap for the upper half, balanced such that size difference is at most 1.',
    expectedTimeComplexity: 'O(log N) for addNum, O(1) for findMedian',
    expectedSpaceComplexity: 'O(N) to store all incoming stream elements',
    edgeCases: ['Single element', 'Even vs odd total elements count', 'Negative numbers and duplicates'],
    suggestedTimeMinutes: 15,
    detailedExplanation: `### Algorithmic Concept & Intuition:
Sorting on every call takes O(N log N). Instead, split the stream into two balanced halves:
- **Left half (lower numbers)**: Stored in a Max-Heap (\`maxHeap\`).
- **Right half (higher numbers)**: Stored in a Min-Heap (\`minHeap\`).

Invariant:
- Every element in \`maxHeap\` <= every element in \`minHeap\`.
- \`maxHeap.size() == minHeap.size()\` (when even), or \`maxHeap.size() == minHeap.size() + 1\` (when odd).

When \`findMedian()\` is called:
- If sizes are equal, median is \`(maxHeap.peek() + minHeap.peek()) / 2.0\`.
- If odd, median is \`maxHeap.peek()\`.`,
    workingCode: `import java.util.PriorityQueue;
import java.util.Collections;

public class MedianFinder {
    private final PriorityQueue<Integer> maxHeap; // stores smaller half
    private final PriorityQueue<Integer> minHeap; // stores larger half

    public MedianFinder() {
        this.maxHeap = new PriorityQueue<>(Collections.reverseOrder());
        this.minHeap = new PriorityQueue<>();
    }

    public void addNum(int num) {
        maxHeap.offer(num);
        minHeap.offer(maxHeap.poll());

        // Balance sizes so maxHeap has at most 1 more element than minHeap
        if (minHeap.size() > maxHeap.size()) {
            maxHeap.offer(minHeap.poll());
        }
    }

    public double findMedian() {
        if (maxHeap.size() > minHeap.size()) {
            return maxHeap.peek();
        }
        return (maxHeap.peek() + minHeap.peek()) / 2.0;
    }
}`,
  },
];

export function generateMockRegeneratedDsaProblem(
  oldProblemId: string,
  avoidTitles: string[] = []
): DsaProblem {
  const candidate = MOCK_DSA_ALTERNATIVE_POOL.find(
    (p) => !avoidTitles.includes(p.title) && p.id !== oldProblemId
  ) || MOCK_DSA_ALTERNATIVE_POOL[0];

  return {
    ...candidate,
    id: `dsa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  };
}

export function generateMockAssistantResponse(problem: DsaProblem, query: string): string {
  const q = query.toLowerCase();
  if (q.includes('hint') || q.includes('stuck') || q.includes('clue')) {
    return `**Suggested Interviewer Hint for ${problem.title}:**\nAsk the candidate: *"Can we avoid recomputing work for overlapping intervals/elements? What data structure gives us O(1) retrieval for the current extremum?"*\n\nIf they are using brute-force, prompt them: *"Notice how elements enter and leave the window one by one. Can we maintain a sorted or monotonic structure?"*`;
  }
  if (q.includes('complexity') || q.includes('time') || q.includes('space')) {
    return `**Complexity Guide for ${problem.title}:**\n- **Target Time Complexity:** ${problem.expectedTimeComplexity}\n- **Target Space Complexity:** ${problem.expectedSpaceComplexity}\n\n*Acceptable trade-offs:* If the candidate proposes an O(N log N) approach, acknowledge correctness and ask: *"Can we eliminate the log factor using an auxiliary structure like a Deque or HashMap?"*`;
  }
  if (q.includes('edge case') || q.includes('trap')) {
    return `**Key Edge Cases to Test Candidate On:**\n${problem.edgeCases.map((ec, i) => `${i + 1}. **${ec}**`).join('\n')}\n\nWatch out if the candidate forgets to handle null/empty inputs or off-by-one boundary conditions.`;
  }
  return `**Interviewer Copilot Evaluation:**\nRegarding your query about **${problem.title}**: The candidate's approach should aim for ${problem.expectedTimeComplexity}. Optimal implementation is ${problem.expectedApproach}.\n\nYou can ask them to trace their logic on sample input: \`${problem.sampleInputs[0] || '[example]'}\` and verify that memory does not exceed ${problem.expectedSpaceComplexity}.`;
}

export function generateMockCustomQuestion(
  params: GenerateCustomQuestionParams
): ContextualAlternative {
  const promptText = params.customPrompt.trim();
  const titleWords = promptText.split(/\s+/).slice(0, 6).join(' ');
  const title = titleWords.length > 0 ? titleWords : `${params.originalQuestion.topic} Custom Inquiry`;

  return {
    id: `alt_custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    sessionId: params.sessionId,
    originalQuestionId: params.originalQuestion.id,
    title: title.length > 50 ? `${title.slice(0, 47)}...` : title,
    question: promptText,
    category: params.originalQuestion.category,
    difficulty: (params.difficulty as string) || params.originalQuestion.difficulty,
    projectContextUsed: 'Interviewer Custom Question',
    reasonForAdaptation: 'Interviewer provided custom replacement question',
    expectedAnswer: `Candidate should provide a structured, in-depth architectural and technical answer for: "${promptText}". They should explain key mechanisms, design trade-offs, potential failure points, and production considerations.`,
    evaluationPoints: [
      `Direct and precise answer to: "${title}"`,
      'Demonstrates real-world engineering depth and trade-off analysis',
      'Addresses resilience, concurrency, and failure recovery scenarios',
    ],
    commonMistakes: [
      'Giving a surface-level or textbook definition without addressing operational edge cases',
      'Overlooking concurrency, race conditions, or network latency implications',
    ],
    redFlags: [
      'Cannot explain core fundamentals or architecture relevant to this inquiry',
      'Suggests patterns that lead to data inconsistency or silent failures in production',
    ],
    followUpQuestions: [
      'How would this solution scale if request volume increases by 10x?',
      'What observability metrics and alerts would you configure in production?',
    ],
    suggestedTimeMinutes: params.originalQuestion.suggestedTimeMinutes || 6,
    evaluationRubric: `Evaluate technical depth, practical system design choices, and clarity of communication for ${title}.`,
    competency: params.originalQuestion.category,
    isCustomEdited: true,
  };
}
