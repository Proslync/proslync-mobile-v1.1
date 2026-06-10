// Single point of access for sourced photo URLs.
// Source of truth: lib/data/photo-sources.json (provenance manifest).
// Resolves athlete / agent / event id → URL with a name-based fallback so
// mock data files don't have to repeat slugs.

import sources from './photo-sources.json';

type Entry = { name: string; url: string; source_page: string };
type EntryMap = Record<string, Entry>;

const athletes = sources.athletes as EntryMap;
const agents = sources.agents as EntryMap;
const events = sources.events as Record<string, { name: string; url: string; source_page: string; natural_size?: string }>;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/jr\.?$/i, '')
    .replace(/[^a-z0-9 ]+/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const nameIndex: Record<string, string> = {};
for (const [id, entry] of Object.entries(athletes)) {
  nameIndex[slugify(entry.name)] = entry.url;
  nameIndex[id] = entry.url;
}
for (const [id, entry] of Object.entries(agents)) {
  nameIndex[slugify(entry.name)] = entry.url;
  nameIndex[id] = entry.url;
}

export function getHeadshotUrl(nameOrId: string): string | undefined {
  return nameIndex[slugify(nameOrId)] ?? nameIndex[nameOrId];
}

export function getEventFlyerUrl(id: string): string | undefined {
  return events[id]?.url;
}

export const ALL_SOURCED_PHOTO_URLS: readonly string[] = [
  ...Object.values(athletes).map((e) => e.url),
  ...Object.values(agents).map((e) => e.url),
  ...Object.values(events).map((e) => e.url),
];

export const SOURCED_EVENT_FLYER_IDS = Object.keys(events);
