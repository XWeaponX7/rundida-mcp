#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = 'https://rundida.com';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Simple in-memory cache
const cache = new Map();

async function fetchJSON(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  cache.set(url, { data, ts: Date.now() });
  return data;
}

// ---- Pace calculation helpers ----

function paceToSeconds(pace) {
  const [m, s] = pace.split(':').map(Number);
  return m * 60 + (s || 0);
}

function secondsToPace(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeToSeconds(time) {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

function secondsToTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.round(secs % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const DISTANCES = {
  '5k': 5,
  '10k': 10,
  'half': 21.0975,
  'half-marathon': 21.0975,
  'marathon': 42.195,
  '50k': 50,
  '100k': 100,
};

function resolveDistance(input) {
  const lower = String(input).toLowerCase().trim();
  if (DISTANCES[lower]) return DISTANCES[lower];
  const num = parseFloat(lower);
  if (!isNaN(num) && num > 0) return num;
  throw new Error(`Unknown distance: ${input}. Use 5k, 10k, half, marathon, or a number in km.`);
}

// ---- Riegel race prediction ----

function predictTime(knownDist, knownTimeSecs, targetDist, exponent = 1.06) {
  return knownTimeSecs * Math.pow(targetDist / knownDist, exponent);
}

// ---- VO2max estimation (Jack Daniels) ----

function estimateVO2max(distKm, timeSecs) {
  const timeMin = timeSecs / 60;
  const velocity = distKm * 1000 / timeMin; // meters per minute
  const pctVO2max = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMin)
    + 0.2989558 * Math.exp(-0.1932605 * timeMin);
  const vo2 = -4.60 + 0.182258 * velocity + 0.000104 * velocity * velocity;
  return vo2 / pctVO2max;
}

// ---- Heart Rate Zones (Karvonen) ----

function heartRateZones(age, restingHR, maxHR) {
  const mhr = maxHR || Math.round(207 - 0.7 * age);
  const hrr = mhr - restingHR;
  const zones = [
    { zone: 1, name: 'Recovery', low: 0.50, high: 0.60 },
    { zone: 2, name: 'Aerobic', low: 0.60, high: 0.70 },
    { zone: 3, name: 'Tempo', low: 0.70, high: 0.80 },
    { zone: 4, name: 'Threshold', low: 0.80, high: 0.90 },
    { zone: 5, name: 'VO2max', low: 0.90, high: 1.00 },
  ];
  return {
    maxHR: mhr,
    restingHR,
    zones: zones.map(z => ({
      ...z,
      bpmLow: Math.round(restingHR + hrr * z.low),
      bpmHigh: Math.round(restingHR + hrr * z.high),
    })),
  };
}

// ---- Create Server ----

const server = new McpServer({
  name: 'RunDida',
  version: '1.2.1',
});

// Tool: list_tools
server.tool(
  'list_tools',
  'List all available running calculators and tools on RunDida',
  {},
  async () => {
    const data = await fetchJSON(`${BASE_URL}/api/tools.json`);
    const list = data.tools.map(t => `- ${t.title} (${t.slug}): ${t.description}`).join('\n');
    return {
      content: [{
        type: 'text',
        text: `RunDida has ${data.meta.total} running tools:\n\n${list}\n\nUse get_tool with a slug to see full details.`,
      }],
    };
  }
);

// Tool: get_tool
server.tool(
  'get_tool',
  'Get detailed information about a specific running tool including FAQs and related tools',
  { slug: z.string().describe('Tool slug, e.g. "pace-calculator", "heart-rate-zones"') },
  async ({ slug }) => {
    const data = await fetchJSON(`${BASE_URL}/api/tools/${slug}.json`);
    const t = data.tool;
    let text = `## ${t.title}\n\n${t.description}\n\nURL: ${t.url}\nCategory: ${t.category}\n`;
    if (t.relatedTools.length) text += `\nRelated tools: ${t.relatedTools.join(', ')}`;
    if (t.faqs.length) {
      text += '\n\n### FAQs\n';
      t.faqs.forEach(f => { text += `\n**Q: ${f.question}**\nA: ${f.answer}\n`; });
    }
    return { content: [{ type: 'text', text }] };
  }
);

// Tool: list_marathons
server.tool(
  'list_marathons',
  'List all marathon events tracked by RunDida with dates and locations',
  {},
  async () => {
    const data = await fetchJSON(`${BASE_URL}/api/marathons.json`);
    const list = data.active
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => {
        const tierLabel = m.tier === 1 ? ' ★' : '';
        const idHint = m.slug || m.id;
        return `- ${m.name.en}${tierLabel} — ${m.date} — ${m.city} [${idHint}]`;
      })
      .join('\n');
    return {
      content: [{
        type: 'text',
        text: `RunDida tracks ${data.meta.totalActive} upcoming marathons:\n\n${list}\n\nUse get_marathon with an ID or slug (e.g. "tokyo", "boston2026") for details.\n★ = World Major / Flagship race`,
      }],
    };
  }
);

// Tool: get_marathon
server.tool(
  'get_marathon',
  'Get detailed information about a specific marathon including countdown and Schema.org data',
  { id: z.string().describe('Marathon ID or slug, e.g. "tokyo", "boston", "berlin2026", "kobe2026"') },
  async ({ id }) => {
    let data;
    try {
      data = await fetchJSON(`${BASE_URL}/api/marathons/${id}.json`);
    } catch {
      // Fallback: try slug without year for Tier 1 marathons
      const slug = id.replace(/\d{4}$/, '');
      data = await fetchJSON(`${BASE_URL}/api/marathons/${slug}.json`);
    }
    const m = data.marathon;
    const raceDate = new Date(m.date);
    const now = new Date();
    const daysUntil = Math.ceil((raceDate - now) / (1000 * 60 * 60 * 24));
    let text = `## ${m.name.en}\n\nDate: ${m.date}\nCity: ${m.city}\n`;
    if (m.country) text += `Country/Region: ${m.country}\n`;
    text += `Timezone: ${m.timezone}\n`;
    text += `Days until race: ${daysUntil > 0 ? daysUntil : 'Race has passed'}\n`;
    if (m.weather) {
      text += `\n### Race Day Weather\nTemperature: ${m.weather.avgTempC}°C / ${m.weather.avgTempF}°F\n`;
      text += `Humidity: ${m.weather.humidity}% | Wind: ${m.weather.windKmh} km/h | Rain: ${m.weather.precipPct}%\n`;
      text += `Conditions: ${m.weather.conditions}\n`;
    }
    if (m.course) {
      text += `\n### Course Profile\nType: ${m.course.type} | Elevation: ${m.course.elevationGain}m | Terrain: ${m.course.terrain}\n`;
      text += `${m.course.profile}\n`;
    }
    text += `\nPage: ${m.links.page}\nCountdown: ${m.links.countdown}\n`;
    return { content: [{ type: 'text', text }] };
  }
);

// Tool: calculate_pace
server.tool(
  'calculate_pace',
  'Calculate running pace, finish time, or distance. Provide any two of: distance, time, pace.',
  {
    distance: z.string().optional().describe('Distance: "5k", "10k", "half", "marathon", or km value like "15"'),
    time: z.string().optional().describe('Finish time in H:MM:SS or MM:SS format, e.g. "3:30:00" or "25:00"'),
    pace: z.string().optional().describe('Pace per km in M:SS format, e.g. "5:00"'),
  },
  async ({ distance, time, pace }) => {
    const given = [distance, time, pace].filter(Boolean).length;
    if (given < 2) throw new Error('Provide at least 2 of: distance, time, pace');

    let result = {};

    if (distance && time) {
      const distKm = resolveDistance(distance);
      const timeSecs = timeToSeconds(time);
      const paceSecs = timeSecs / distKm;
      result = {
        distance: `${distKm} km`,
        time: secondsToTime(timeSecs),
        pace: `${secondsToPace(paceSecs)}/km`,
        speed: `${(distKm / (timeSecs / 3600)).toFixed(2)} km/h`,
      };
    } else if (distance && pace) {
      const distKm = resolveDistance(distance);
      const paceSecs = paceToSeconds(pace);
      const timeSecs = distKm * paceSecs;
      result = {
        distance: `${distKm} km`,
        time: secondsToTime(timeSecs),
        pace: `${secondsToPace(paceSecs)}/km`,
        speed: `${(distKm / (timeSecs / 3600)).toFixed(2)} km/h`,
      };
    } else if (time && pace) {
      const timeSecs = timeToSeconds(time);
      const paceSecs = paceToSeconds(pace);
      const distKm = timeSecs / paceSecs;
      result = {
        distance: `${distKm.toFixed(2)} km`,
        time: secondsToTime(timeSecs),
        pace: `${secondsToPace(paceSecs)}/km`,
        speed: `${(distKm / (timeSecs / 3600)).toFixed(2)} km/h`,
      };
    }

    return {
      content: [{
        type: 'text',
        text: Object.entries(result).map(([k, v]) => `${k}: ${v}`).join('\n'),
      }],
    };
  }
);

// Tool: predict_race
server.tool(
  'predict_race',
  'Predict race finish times using the Riegel formula based on a known race result',
  {
    known_distance: z.string().describe('Known race distance: "5k", "10k", "half", "marathon", or km value'),
    known_time: z.string().describe('Known race time in H:MM:SS or MM:SS format'),
    target_distance: z.string().optional().describe('Target distance to predict (defaults to showing all standard distances)'),
  },
  async ({ known_distance, known_time, target_distance }) => {
    const distKm = resolveDistance(known_distance);
    const timeSecs = timeToSeconds(known_time);
    const vo2max = estimateVO2max(distKm, timeSecs);

    const targets = target_distance
      ? [{ name: target_distance, km: resolveDistance(target_distance) }]
      : [
          { name: '5K', km: 5 },
          { name: '10K', km: 10 },
          { name: 'Half Marathon', km: 21.0975 },
          { name: 'Marathon', km: 42.195 },
        ];

    let text = `Based on ${known_distance} in ${known_time}:\n\nEstimated VO2max: ${vo2max.toFixed(1)} ml/kg/min\n\nPredictions:\n`;
    targets.forEach(t => {
      const predicted = predictTime(distKm, timeSecs, t.km);
      const pace = predicted / t.km;
      text += `- ${t.name}: ${secondsToTime(predicted)} (pace: ${secondsToPace(pace)}/km)\n`;
    });

    text += `\nNote: Predictions assume equivalent training for the target distance. Use RunDida's Race Time Predictor for more details: ${BASE_URL}/tools/race-time-predictor/`;
    return { content: [{ type: 'text', text }] };
  }
);

// Tool: heart_rate_zones
server.tool(
  'heart_rate_zones',
  'Calculate heart rate training zones using the Karvonen method',
  {
    age: z.number().min(10).max(99).describe('Your age in years'),
    resting_hr: z.number().min(30).max(120).optional().describe('Resting heart rate in bpm (default: 60)'),
    max_hr: z.number().min(100).max(220).optional().describe('Known max heart rate in bpm (auto-calculated if omitted)'),
  },
  async ({ age, resting_hr, max_hr }) => {
    const result = heartRateZones(age, resting_hr || 60, max_hr);
    let text = `Heart Rate Training Zones (Karvonen Method)\n\nAge: ${age} | Resting HR: ${result.restingHR} bpm | Max HR: ${result.maxHR} bpm\n\n`;
    result.zones.forEach(z => {
      text += `Zone ${z.zone} (${z.name}): ${z.bpmLow}-${z.bpmHigh} bpm\n`;
    });
    text += `\nFor more options: ${BASE_URL}/tools/heart-rate-zones/`;
    return { content: [{ type: 'text', text }] };
  }
);

// Tool: marathon_countdown
server.tool(
  'marathon_countdown',
  'Get a countdown to a specific marathon event',
  { id: z.string().describe('Marathon ID or slug, e.g. "tokyo", "boston", "kobe2026"') },
  async ({ id }) => {
    let data;
    try {
      data = await fetchJSON(`${BASE_URL}/api/marathons/${id}.json`);
    } catch {
      const slug = id.replace(/\d{4}$/, '');
      data = await fetchJSON(`${BASE_URL}/api/marathons/${slug}.json`);
    }
    const m = data.marathon;
    const raceDate = new Date(m.date);
    const now = new Date();
    const diff = raceDate - now;

    if (diff <= 0) {
      return { content: [{ type: 'text', text: `${m.name.en} has already taken place on ${m.date}.` }] };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    let text = `${m.name.en} Countdown\n\n`;
    text += `${days} days, ${hours} hours until race day\n`;
    text += `Date: ${m.date}\nCity: ${m.city}\n`;
    text += `\nLive countdown: ${m.links.countdown}`;
    return { content: [{ type: 'text', text }] };
  }
);

// Tool: list_guides
server.tool(
  'list_guides',
  'List all running guides and educational articles on RunDida',
  {},
  async () => {
    const data = await fetchJSON(`${BASE_URL}/api/guides.json`);
    const list = data.guides.map(g => `- ${g.title} [${g.slug}] (${g.category}): ${g.description.slice(0, 100)}...`).join('\n');
    return {
      content: [{
        type: 'text',
        text: `RunDida has ${data.meta.total} running guides:\n\n${list}\n\nUse get_guide with a slug to see full details including FAQs.`,
      }],
    };
  }
);

// Tool: get_guide
server.tool(
  'get_guide',
  'Get detailed information about a specific running guide including FAQs and related tools',
  { slug: z.string().describe('Guide slug, e.g. "first-marathon-training", "couch-to-5k-complete-guide"') },
  async ({ slug }) => {
    const data = await fetchJSON(`${BASE_URL}/api/guides/${slug}.json`);
    const g = data.guide;
    let text = `## ${g.title}\n\n${g.description}\n\nURL: ${g.url}\nCategory: ${g.category}\n`;
    if (g.relatedTools.length) text += `\nRelated tools: ${g.relatedTools.join(', ')}`;
    if (g.faqs && g.faqs.length) {
      text += '\n\n### FAQs\n';
      g.faqs.forEach(f => { text += `\n**Q: ${f.question}**\nA: ${f.answer}\n`; });
    }
    text += `\nAvailable in: EN (${g.links.page}), ZH (${g.links.pageZh}), JA (${g.links.pageJa})`;
    return { content: [{ type: 'text', text }] };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
