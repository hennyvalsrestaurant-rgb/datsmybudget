# Debug Checklist & Optimization Guide

## Quick Start: Performance Boost

### Phase 1: Identify Issues (30 minutes)

- [ ] Run Lighthouse audit on all major pages
- [ ] Check Network tab in DevTools for slow requests
- [ ] Identify 404 errors and fix them
- [ ] Look for console errors and warnings
- [ ] Check backend logs for errors

**Command**: `npm run lint:check` to find code issues

---

## Common Error Codes & Fixes

### Frontend Errors

#### 404 Not Found
```javascript
// Problem: Resource not found
// Solution: Verify the path exists
$w('#element').onReady(() => {
  // Check if element exists before using
  if ($w('#nonExistent')) {
    // Handle if exists
  }
});
```

#### 503 Service Unavailable
```javascript
// Problem: Server/API unavailable
// Solution: Add retry logic
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      await delay(1000 * (i + 1)); // exponential backoff
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

#### Memory Leaks
```javascript
// Problem: Memory usage increases over time
// Solution: Clean up event listeners
export function page_beforeUnload() {
  // Remove all event listeners
  $w('#button').onClick(() => {}, false);
  // Clear intervals
  if (intervalId) clearInterval(intervalId);
  // Clear timeouts
  if (timeoutId) clearTimeout(timeoutId);
}
```

---

## Performance Optimization Checklist

### Frontend Optimization

#### Assets & Loading
- [ ] Minify all CSS and JavaScript
- [ ] Enable gzip compression
- [ ] Use WebP images with fallbacks
- [ ] Lazy load images below fold
- [ ] Remove unused CSS
- [ ] Defer non-critical JavaScript

#### Example: Lazy Load Images
```javascript
export function page_beforeLoad() {
  $w('#image1').onViewportEnter(() => {
    $w('#image1').src = 'high-res-image.webp';
  });
}
```

#### DOM & Rendering
- [ ] Minimize DOM reflows
- [ ] Batch DOM updates
- [ ] Use display:none instead of height:0
- [ ] Avoid inline styles

#### Example: Batch DOM Updates
```javascript
// Bad: Multiple reflows
$w('#box1').height = 100;
$w('#box2').height = 100;
$w('#box3').height = 100;

// Good: Single update
$w.batch(() => {
  $w('#box1').height = 100;
  $w('#box2').height = 100;
  $w('#box3').height = 100;
});
```

### Backend Optimization

#### Database
- [ ] Add indexes to frequently queried fields
- [ ] Paginate large result sets
- [ ] Use select() to fetch only needed fields
- [ ] Use limit() to reduce data transfer

Example:
```javascript
// Bad: Fetches all items
const items = await collection.query().find();

// Good: Paginated with specific fields
const items = await collection.query()
  .select(['id', 'name', 'price'])
  .limit(50)
  .skip((page - 1) * 50)
  .find();
```

#### API Responses
- [ ] Return only necessary data
- [ ] Use compression
- [ ] Cache responses when appropriate
- [ ] Implement rate limiting

Example:
```javascript
export async function get_items(request) {
  const cached = getCachedData('items');
  if (cached) return cached;

  const items = await fetchItems();
  setCachedData('items', items, 300000); // 5 min cache
  return items;
}
```

#### Error Handling
- [ ] Add try-catch to all async functions
- [ ] Return meaningful error messages
- [ ] Log errors with context
- [ ] Don't expose sensitive info

---

## Performance Testing

### Tools to Use
1. **Chrome DevTools Lighthouse** - Overall score
2. **WebPageTest** - Detailed performance breakdown
3. **GTmetrix** - Performance insights
4. **Network Throttling** - Simulate slow connections

### Test Scenarios
```
Scenario 1: Fast Connection
- 4G Network
- Desktop

Scenario 2: Slow Connection
- 3G Network
- Mobile

Scenario 3: Offline
- No connection
- Test fallbacks
```

### Performance Targets
| Metric | Target |
|--------|--------|
| Largest Contentful Paint (LCP) | < 2.5s |
| First Input Delay (FID) | < 100ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to First Byte (TTFB) | < 600ms |
| Total Blocking Time (TBT) | < 300ms |

---

## Error Code Reference

### Client Errors (4xx)

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Validate all input parameters |
| 401 | Unauthorized | Check authentication token |
| 403 | Forbidden | Verify permissions in permissions.json |
| 404 | Not Found | Check URL and resource existence |
| 429 | Too Many Requests | Implement rate limiting |

### Server Errors (5xx)

| Code | Meaning | Solution |
|------|---------|----------|
| 500 | Internal Server Error | Check backend logs, fix code |
| 502 | Bad Gateway | Check API/database connection |
| 503 | Service Unavailable | Wait or implement retry logic |
| 504 | Gateway Timeout | Optimize slow queries, increase timeout |

---

## Debugging Workflow

### Step 1: Identify the Issue
```bash
# Check browser console
Open DevTools → Console Tab

# Check backend logs
npm run dev  # View real-time logs
```

### Step 2: Reproduce the Issue
- [ ] Document exact steps to reproduce
- [ ] Note browser/device used
- [ ] Check network conditions
- [ ] Save error messages

### Step 3: Isolate the Problem
```javascript
// Add detailed logging
console.log('Before operation:', data);
try {
  const result = await operation();
  console.log('After operation:', result);
} catch (error) {
  console.error('Operation failed:', error);
  console.error('Stack:', error.stack);
}
```

### Step 4: Fix and Test
- [ ] Apply fix
- [ ] Test in dev environment
- [ ] Run: `npm run lint` to check code
- [ ] Test on multiple devices/browsers
- [ ] Verify performance improvement

---

## Code Quality Checks

### Before Committing Code

```bash
# Run linter and fix issues
npm run lint

# Check for linting errors only
npm run lint:check
```

### Common ESLint Issues

| Issue | Fix |
|-------|-----|
| Unused variables | Remove or use them |
| Missing semicolons | Add with `npm run lint` |
| Incorrect indentation | Fix with `npm run lint` |
| console.log in production | Use proper logging |

---

## Monitoring & Alerts

### Setup Monitoring
```javascript
// Track errors in production
window.addEventListener('error', (event) => {
  // Send to monitoring service
  sendErrorReport({
    message: event.message,
    stack: event.error?.stack,
    timestamp: new Date().toISOString()
  });
});

// Track performance
if (window.PerformanceObserver) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.log(`[PERF] ${entry.name}: ${entry.duration}ms`);
    });
  });
  observer.observe({ entryTypes: ['measure'] });
}
```

---

## Quick Wins (Fastest Performance Improvements)

1. **Enable caching** (5-10% improvement)
2. **Minify assets** (10-20% improvement)
3. **Optimize images** (15-30% improvement)
4. **Remove unused code** (5-15% improvement)
5. **Add pagination** (20-50% improvement for large datasets)
6. **Lazy load components** (10-25% improvement)
7. **Implement rate limiting** (Prevents slowdowns)

---

## Resources

- [Wix Velo Debugging](https://support.wix.com/en/article)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Performance Patterns](https://web.dev/performance/)

---

## Support Commands

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Check code quality
npm run lint:check

# Fix code issues
npm run lint

# Sync types with Wix
wix sync-types
```
