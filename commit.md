# 📊 Web Analytics Commit Message Guide

> **Simple, consistent commit messages for analytics platform development**

---

## 📐 Format Structure

```
[TYPE] : Main info
* short desc
```

**Rules:**
- `[TYPE]` in UPPERCASE with brackets
- Space before and after `:`
- Main info in lowercase, present tense, under 50 chars
- Short description starts with `*`, under 72 chars

---

## 🏷️ Commit Types

### Analytics-Specific
| Type | Emoji | Purpose | Example |
|------|-------|---------|---------|
| **[TRACKING]** | 🎯 | Event tracking | `add click event tracking` |
| **[METRIC]** | 📈 | Metrics & calculations | `add bounce rate calculation` |
| **[DASHBOARD]** | 📊 | Dashboard features | `create visitor stats widget` |
| **[DATA]** | 💾 | Data processing | `implement session aggregation` |
| **[REPORT]** | 📑 | Reporting features | `add CSV export functionality` |
| **[QUERY]** | 🔍 | Database queries | `optimize page views query` |

### Frontend
| Type | Emoji | Purpose |
|------|-------|---------|
| **[UI]** | 🖼️ | User interface components |
| **[CHART]** | 📉 | Data visualizations |
| **[FILTER]** | 🔎 | Filtering features |
| **[UX]** | ✨ | User experience |

### Backend
| Type | Emoji | Purpose |
|------|-------|---------|
| **[API]** | 🌐 | API endpoints |
| **[DB]** | 🗄️ | Database changes |
| **[PIPELINE]** | 🔄 | Data pipelines |
| **[CACHE]** | ⚡ | Caching layer |
| **[QUEUE]** | 📬 | Queue systems |
| **[AUTH]** | 🔐 | Authentication |

### General
| Type | Emoji | Purpose |
|------|-------|---------|
| **[FEAT]** | ✨ | New features |
| **[FIX]** | 🐛 | Bug fixes |
| **[REFACTOR]** | ♻️ | Code restructuring |
| **[PERF]** | ⚡ | Performance improvements |
| **[TEST]** | 🧪 | Testing |
| **[DOCS]** | 📚 | Documentation |
| **[CONFIG]** | ⚙️ | Configuration |
| **[CHORE]** | 🧹 | Maintenance tasks |

### Special
| Type | Emoji | Purpose |
|------|-------|---------|
| **[HOTFIX]** | 🚑 | Critical production fixes |
| **[SECURITY]** | 🔒 | Security fixes |
| **[BREAKING]** | 💥 | Breaking changes |
| **[MIGRATION]** | 🚚 | Data migration |
| **[DEPLOY]** | 🚀 | Deployment |
| **[REVERT]** | ⏪ | Rollback changes |

---

## ✍️ Writing Guidelines

**Do's:**
- Use present tense ("add" not "added")
- Start main info with lowercase
- Be specific and descriptive
- Explain the "why" in description

**Don'ts:**
- No periods at end of main info
- No vague terms ("update", "fix stuff")
- No past tense or gerunds

---

## 📝 Examples

### Good Examples ✅

```bash
[TRACKING] : add page view event tracking
* capture referrer and utm parameters

[METRIC] : implement conversion rate calculation
* group by traffic source with attribution

[DASHBOARD] : create real-time visitors widget
* websocket-based live updates every 5 seconds

[API] : add metrics query endpoint
* support date range and segment filtering

[FIX] : resolve duplicate event recording
* debounce rapid clicks with 300ms delay

[PERF] : optimize dashboard query performance
* add composite index on user_id and timestamp

[DB] : add events table partitioning
* monthly partitions for efficient querying

[SECURITY] : implement IP anonymization
* mask last octet for GDPR compliance

[CHART] : add time series line chart component
* support multiple metrics with zoom functionality

[PIPELINE] : implement event validation layer
* reject malformed events before processing

[CACHE] : add redis caching for dashboard queries
* 5-minute TTL with cache warming strategy
```

### Bad Examples ❌

```bash
# Too vague
[FIX] : fixed bug
* something wasn't working

# Wrong format
FEAT: Added new feature

# Missing description
[FEAT] : add dashboard

# Wrong tense
[FEAT] : added new tracking
* implemented yesterday
```

---

## 🏁 Quick Reference

**Most Common Types:**
- 🎯 `[TRACKING]` - Event tracking
- 📈 `[METRIC]` - Metrics & KPIs
- 📊 `[DASHBOARD]` - Dashboard features
- 🌐 `[API]` - API endpoints
- 🐛 `[FIX]` - Bug fixes
- ⚡ `[PERF]` - Performance

**Format:**
```
[TYPE] : action in present tense (< 50 chars)
* why or how explanation (< 72 chars)
```

**Key Principles:**
1. 🎯 One commit = One logical change
2. 📝 Present tense imperative
3. 🔍 Specific and searchable
4. 📊 Consider data impact

---

*Keep commits focused, descriptive, and consistent!* ✨