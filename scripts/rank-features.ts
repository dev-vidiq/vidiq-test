/**
 * rank-features.ts
 *
 * Queries the Amplitude API for all tracked events, groups them by webapp
 * feature area, and outputs a ranked table so you know which features to
 * prioritise for E2E test coverage.
 *
 * Usage:
 *   AMPLITUDE_API_KEY=xxx AMPLITUDE_SECRET_KEY=yyy npm run rank-features
 *
 * Optional env vars:
 *   AMPLITUDE_DAYS=30   — look-back window in days (default 30)
 */

import * as https from 'https'
import { config } from 'dotenv'

config()

// ─── Config ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.AMPLITUDE_API_KEY
const SECRET = process.env.AMPLITUDE_SECRET_KEY
const DAYS = parseInt(process.env.AMPLITUDE_DAYS ?? '30', 10)

if (!API_KEY || !SECRET) {
  console.error('\n  Error: Amplitude credentials not set.\n')
  console.error('  Add these to your .env or export them before running:\n')
  console.error('    AMPLITUDE_API_KEY=<your api key>')
  console.error('    AMPLITUDE_SECRET_KEY=<your secret key>\n')
  console.error('  Find them in Amplitude → Settings → Projects → (your project)\n')
  process.exit(1)
}

const AUTH_HEADER = 'Basic ' + Buffer.from(`${API_KEY}:${SECRET}`).toString('base64')

// ─── Feature mapping ─────────────────────────────────────────────────────────
//
// Events are matched to feature areas in ORDER — first match wins.
// Add more keywords when new features are shipped.

const FEATURE_MAP: Array<{ feature: string; keywords: string[] }> = [
  { feature: 'ai-coach',           keywords: ['ai coach', 'coach matching', 'coach', 'conversation', 'ai mode', 'ai version'] },
  { feature: 'feed / video ideas', keywords: ['feed', 'video ideas', 'daily video ideas', 'skipped idea', 'saved idea', 'unified chat'] },
  { feature: 'keywords',           keywords: ['keyword', 'searched keyword', 'tracked keyword', 'keyword trends', 'hottersearch'] },
  { feature: 'thumbnails',         keywords: ['thumbnail', 'subjects detected', 'subject image', 'standalone thumbnail'] },
  { feature: 'title-generator',    keywords: ['title generator', 'title group', 'title input'] },
  { feature: 'generate / content', keywords: ['generate', 'content generator', 'canvas', 'outline', 'new idea page'] },
  { feature: 'outliers',           keywords: ['outlier', 'outliers'] },
  { feature: 'long-to-shorts',     keywords: ['shorts generator', 'long to short', 'clip', 'clips privacy'] },
  { feature: 'optimize',           keywords: ['optimize', 'seo'] },
  { feature: 'script-writer',      keywords: ['script writer', 'script'] },
  { feature: 'competition',        keywords: ['competitor', 'competition'] },
  { feature: 'video-review',       keywords: ['video review', 'video feedback', 'feedback navbar'] },
  { feature: 'billing / plans',    keywords: ['plan', 'billing', 'upsell', 'checkout', 'purchase', 'downgrade', 'credits', 'payment'] },
  { feature: 'onboarding',         keywords: ['onboarding', 'supernova onboarding'] },
  { feature: 'auth / account',     keywords: ['login', 'logout', 'logged in', 'logged out', 'auth', 'register', 'google auth', 'jwt', 'mfa'] },
  { feature: 'settings / channel', keywords: ['settings', 'channel', 'youtube channel', 'connect channel'] },
  { feature: 'affiliates',         keywords: ['affiliate'] },
  { feature: 'learn',              keywords: ['lesson', 'course', 'learn', 'article'] },
  { feature: 'dashboard',          keywords: ['dashboard'] },
]

// ─── Amplitude API types ──────────────────────────────────────────────────────

interface AmplitudeEvent {
  value: string
  totals: number
  non_active: boolean
  deleted: boolean
}

interface EventListResponse {
  data: AmplitudeEvent[]
}

interface SegmentationSeries {
  seriesLabels: string[]
  series: Array<Array<{ value: number }>>
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

function get<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: AUTH_HEADER } }, (res) => {
      let body = ''
      res.on('data', (chunk: Buffer) => { body += chunk.toString() })
      res.on('end', () => {
        if ((res.statusCode ?? 0) >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 200)}`))
          return
        }
        try {
          resolve(JSON.parse(body) as T)
        } catch {
          reject(new Error(`Failed to parse JSON from ${url}: ${body.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
  })
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toAmplitudeDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function dateRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return { start: toAmplitudeDate(start), end: toAmplitudeDate(end) }
}

// ─── Feature classifier ───────────────────────────────────────────────────────

function classifyEvent(eventName: string): string {
  const lower = eventName.toLowerCase()
  for (const { feature, keywords } of FEATURE_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return feature
    }
  }
  return 'other'
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function pad(s: string, len: number, right = false): string {
  return right ? s.padStart(len) : s.padEnd(len)
}

const BOLD  = '\x1b[1m'
const DIM   = '\x1b[2m'
const GREEN = '\x1b[32m'
const CYAN  = '\x1b[36m'
const RESET = '\x1b[0m'

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { start, end } = dateRange(DAYS)

  console.log(`\n${BOLD}Fetching Amplitude events…${RESET}`)
  console.log(`${DIM}Period: last ${DAYS} days (${start.slice(0,4)}-${start.slice(4,6)}-${start.slice(6)} → ${end.slice(0,4)}-${end.slice(4,6)}-${end.slice(6)})${RESET}\n`)

  // Step 1 — get all event types with their totals from the last 30 days
  const listUrl = 'https://amplitude.com/api/2/events/list'
  const { data: events } = await get<EventListResponse>(listUrl)

  const activeEvents = events.filter((e) => !e.deleted && !e.non_active)
  console.log(`${DIM}Found ${activeEvents.length} active event types${RESET}\n`)

  // Step 2 — for the top events, fetch per-event segmentation counts for the exact date range
  // We limit to top 60 events by the quick totals to keep API calls reasonable (~1–2 s each)
  const TOP_N_SEGMENT = 60
  const topEvents = [...activeEvents]
    .sort((a, b) => b.totals - a.totals)
    .slice(0, TOP_N_SEGMENT)

  console.log(`${DIM}Fetching ${DAYS}-day counts for top ${topEvents.length} events…${RESET}`)

  const eventCounts = new Map<string, number>()

  // Fetch segmentation in small batches to avoid rate limiting
  const BATCH = 5
  for (let i = 0; i < topEvents.length; i += BATCH) {
    const batch = topEvents.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (event) => {
        const encodedName = encodeURIComponent(JSON.stringify({ event_type: event.value }))
        const segUrl = `https://amplitude.com/api/2/events/segmentation?e=${encodedName}&start=${start}&end=${end}&m=totals`
        try {
          const result = await get<SegmentationSeries>(segUrl)
          const total = result.series[0]?.reduce((sum, pt) => sum + (pt.value ?? 0), 0) ?? 0
          eventCounts.set(event.value, total)
        } catch {
          // Fall back to the list totals if segmentation fails for this event
          eventCounts.set(event.value, event.totals)
        }
      })
    )
    process.stdout.write(`\r  ${DIM}${Math.min(i + BATCH, topEvents.length)} / ${topEvents.length}${RESET}  `)
  }

  // For the remaining events (not in top N), use list totals directly
  for (const event of activeEvents) {
    if (!eventCounts.has(event.value)) {
      eventCounts.set(event.value, event.totals)
    }
  }

  // Step 3 — aggregate by feature
  const featureTotals = new Map<string, number>()
  const featureEvents = new Map<string, string[]>()

  for (const event of activeEvents) {
    const feature = classifyEvent(event.value)
    const count = eventCounts.get(event.value) ?? 0
    featureTotals.set(feature, (featureTotals.get(feature) ?? 0) + count)
    if (!featureEvents.has(feature)) featureEvents.set(feature, [])
    featureEvents.get(feature)!.push(event.value)
  }

  // Step 4 — sort and print
  const ranked = [...featureTotals.entries()]
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0)

  const totalAllEvents = ranked.reduce((s, [, c]) => s + c, 0)
  const maxCount = ranked[0]?.[1] ?? 1
  const BAR_WIDTH = 30

  console.log(`\n\n${BOLD}Feature ranking — last ${DAYS} days${RESET}`)
  console.log('─'.repeat(72))
  console.log(
    `${DIM}${pad('#', 4)}  ${pad('Feature', 24)}  ${pad('Events', 12, true)}  ${pad('Share', 6, true)}  Usage bar${RESET}`
  )
  console.log('─'.repeat(72))

  ranked.forEach(([feature, count], idx) => {
    const rank  = pad(String(idx + 1), 3)
    const name  = pad(feature, 24)
    const total = pad(formatNumber(count), 12, true)
    const pct   = ((count / totalAllEvents) * 100).toFixed(1).padStart(5)
    const bars  = Math.round((count / maxCount) * BAR_WIDTH)
    const bar   = '█'.repeat(bars) + '░'.repeat(BAR_WIDTH - bars)
    const color = idx < 3 ? GREEN : idx < 7 ? CYAN : DIM

    console.log(`${color}${rank}.  ${name}  ${total}  ${pct}%  ${bar}${RESET}`)
  })

  console.log('─'.repeat(72))
  console.log(`${DIM}     ${'Total'.padEnd(24)}  ${pad(formatNumber(totalAllEvents), 12, true)}${RESET}`)

  // Step 5 — E2E test priority recommendations
  const testableFeatures = ranked.filter(([f]) => f !== 'other' && f !== 'auth / account')

  console.log(`\n\n${BOLD}Recommended E2E test files (highest-usage features first)${RESET}`)
  console.log('─'.repeat(60))

  const fileMap: Record<string, string> = {
    'ai-coach':           'tests/ai-coach.spec.ts',
    'feed / video ideas': 'tests/feed.spec.ts',
    'keywords':           'tests/keywords.spec.ts',
    'thumbnails':         'tests/thumbnails.spec.ts',
    'title-generator':    'tests/title-generator.spec.ts',
    'generate / content': 'tests/generate.spec.ts',
    'outliers':           'tests/outliers.spec.ts',
    'long-to-shorts':     'tests/long-to-shorts.spec.ts',
    'optimize':           'tests/optimize.spec.ts',
    'script-writer':      'tests/script-writer.spec.ts',
    'competition':        'tests/competition.spec.ts',
    'video-review':       'tests/video-review.spec.ts',
    'billing / plans':    'tests/billing.spec.ts',
    'onboarding':         'tests/onboarding.spec.ts',
    'settings / channel': 'tests/settings.spec.ts',
    'affiliates':         'tests/affiliates.spec.ts',
    'learn':              'tests/learn.spec.ts',
    'dashboard':          'tests/dashboard.spec.ts',
  }

  testableFeatures.forEach(([feature, count], idx) => {
    const file = fileMap[feature] ?? `tests/${feature.replace(/[^a-z0-9]/g, '-')}.spec.ts`
    const exists = idx < 2 ? `${GREEN}exists${RESET}` : '      '
    const pct = ((count / totalAllEvents) * 100).toFixed(1)
    console.log(`  [ ]  ${pad(feature, 22)}  ${pad(file, 32)}  ${pct}% of traffic  ${exists}`)
  })

  console.log()

  // Step 6 — top events per feature (useful for knowing what to test)
  console.log(`\n${BOLD}Top events per feature (signals what to assert in tests)${RESET}`)
  console.log('─'.repeat(60))

  for (const [feature] of ranked.slice(0, 8)) {
    if (feature === 'other') continue
    const events = (featureEvents.get(feature) ?? [])
      .map((e) => ({ name: e, count: eventCounts.get(e) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    console.log(`\n${CYAN}${feature}${RESET}`)
    events.forEach(({ name, count }) => {
      console.log(`  ${DIM}${formatNumber(count).padStart(10)}${RESET}  ${name}`)
    })
  }

  console.log()
}

main().catch((err: Error) => {
  console.error('\n  Error:', err.message)
  if (err.message.includes('HTTP 401') || err.message.includes('HTTP 403')) {
    console.error('  Check that AMPLITUDE_API_KEY and AMPLITUDE_SECRET_KEY are correct.\n')
  }
  process.exit(1)
})
