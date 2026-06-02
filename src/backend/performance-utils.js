// Simple in-memory cache with expiration
class Cache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.store = new Map();
    this.ttl = ttl;
  }

  set(key, value, customTtl = null) {
    const expiresAt = Date.now() + (customTtl || this.ttl);
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);

    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  getStats() {
    return {
      size: this.store.size,
      ttl: this.ttl
    };
  }
}

// Create shared cache instance
export const cache = new Cache();

// Query optimizer
export class QueryOptimizer {
  static paginate(data, page = 1, pageSize = 20) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: data.slice(start, end),
      pagination: {
        page,
        pageSize,
        total: data.length,
        totalPages: Math.ceil(data.length / pageSize)
      }
    };
  }

  static filter(data, filters) {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) return true;
        if (Array.isArray(value)) return value.includes(item[key]);
        return item[key] === value;
      });
    });
  }

  static sort(data, sortBy, direction = 'asc') {
    const copy = [...data];
    return copy.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return direction === 'asc' ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  static search(data, searchTerm, fields = []) {
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
      return fields.some(field => {
        const value = item[field]?.toString().toLowerCase();
        return value?.includes(term);
      });
    });
  }
}

// Request deduplication
class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
  }

  async deduplicate(key, fn) {
    // If request is already pending, wait for it
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Create promise for this request
    const promise = fn()
      .then(result => {
        this.pending.delete(key);
        return result;
      })
      .catch(error => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }
}

export const deduplicator = new RequestDeduplicator();

// Performance metrics
export class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(label) {
    this.metrics.set(label, Date.now());
  }

  endTimer(label) {
    if (!this.metrics.has(label)) {
      console.warn(`Timer "${label}" was not started`);
      return null;
    }

    const startTime = this.metrics.get(label);
    const duration = Date.now() - startTime;
    this.metrics.delete(label);

    return duration;
  }

  async measure(label, fn) {
    this.startTimer(label);
    try {
      const result = await fn();
      const duration = this.endTimer(label);
      console.log(`[PERF] ${label}: ${duration}ms`);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }
}

export const metrics = new PerformanceMetrics();

// Batch processing
export async function processBatch(items, batchSize = 10, processor) {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);
  }

  return results;
}

// Rate limiter
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      time => now - time < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  getRemainingRequests(identifier) {
    const userRequests = this.requests.get(identifier) || [];
    const now = Date.now();
    const recentRequests = userRequests.filter(
      time => now - time < this.windowMs
    );
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

// Data compression utilities
export function compressData(data) {
  return JSON.stringify(data);
}

export function decompressData(compressedData) {
  return JSON.parse(compressedData);
}

// Response optimization
export function optimizeResponse(data, fields = null) {
  if (Array.isArray(data)) {
    return data.map(item => selectFields(item, fields));
  }
  return selectFields(data, fields);
}

function selectFields(obj, fields) {
  if (!fields) return obj;
  return fields.reduce((acc, field) => {
    acc[field] = obj[field];
    return acc;
  }, {});
}
