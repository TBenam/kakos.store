import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = process.env.TIKTOK_RADAR_API_BASE || 'http://127.0.0.1:3107';
const RESULT_COUNT = Math.min(Number(process.env.TIKTOK_RADAR_RESULT_COUNT || 24), 30);
const MAX_AGE_DAYS = Number(process.env.TIKTOK_RADAR_MAX_AGE_DAYS || 240);

const DEFAULT_QUERIES = [
  'arrivage grossiste Douala prix',
  'grossiste chaussures Douala',
  'vente en gros sacs Douala',
  'grossiste vêtements Douala',
  'grossiste parfums Douala',
  'grossiste cosmétiques Douala',
  'grossiste électroménager Douala',
  'prix carton Douala',
  'liquidation stock Douala',
  'fournisseur Yaoundé prix grossiste',
  'nouvel arrivage Cameroun grossiste',
  'vente en gros accessoires Douala',
];

const queries = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_QUERIES;
const now = Date.now();

function allText(item) {
  return [
    item.desc,
    item.author?.signature,
    ...(item.contents || []).map((entry) => entry?.desc),
    ...(item.stickersOnItem || []).flatMap((sticker) => sticker?.stickerText || []),
  ]
    .filter(Boolean)
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueMatches(text, regex) {
  return [...new Set([...text.matchAll(regex)].map((match) => match[0].trim()))];
}

function compact(item, query) {
  const text = allText(item);
  const createdAt = new Date(Number(item.createTime) * 1000);
  const ageDays = Math.max(0, Math.floor((now - createdAt.getTime()) / 86_400_000));
  const username = item.author?.uniqueId || '';

  return {
    id: item.id,
    query,
    url: username && item.id ? `https://www.tiktok.com/@${username}/video/${item.id}` : '',
    author: username,
    authorName: item.author?.nickname || '',
    authorBio: item.author?.signature || '',
    createdAt: createdAt.toISOString(),
    ageDays,
    description: item.desc || '',
    visibleText: text,
    prices: uniqueMatches(
      text,
      /(?:\b\d{1,3}(?:[ .,\u202f]\d{3})+|\b\d{3,6})\s*(?:f(?:cfa)?|frs?)\b/giu,
    ),
    phones: uniqueMatches(text, /(?:\+?237[ .-]?)?6(?:[ .-]?\d){8}\b/gu),
    views: Number(item.statsV2?.playCount || item.stats?.playCount || 0),
    likes: Number(item.statsV2?.diggCount || item.stats?.diggCount || 0),
    comments: Number(item.statsV2?.commentCount || item.stats?.commentCount || 0),
    shares: Number(item.statsV2?.shareCount || item.stats?.shareCount || 0),
    cover: item.video?.cover || item.video?.originCover || '',
  };
}

async function search(query) {
  const url = new URL('/tiktok/search/general', API_BASE);
  url.searchParams.set('keyword', query);
  url.searchParams.set('count', String(RESULT_COUNT));

  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  return (payload.data || [])
    .map((entry) => entry?.item)
    .filter(Boolean)
    .map((item) => compact(item, query));
}

const collected = [];
const errors = [];

for (const query of queries) {
  try {
    const results = await search(query);
    collected.push(...results);
    process.stderr.write(`✓ ${query}: ${results.length} résultats\n`);
  } catch (error) {
    errors.push({ query, error: error instanceof Error ? error.message : String(error) });
    process.stderr.write(`✗ ${query}: ${errors.at(-1).error}\n`);
  }
}

const byVideo = new Map();
for (const candidate of collected) {
  const previous = byVideo.get(candidate.id);
  if (!previous) {
    byVideo.set(candidate.id, candidate);
    continue;
  }
  previous.query = [...new Set(`${previous.query}|${candidate.query}`.split('|'))].join(' | ');
}

const candidates = [...byVideo.values()]
  .filter((candidate) => candidate.ageDays <= MAX_AGE_DAYS)
  .filter((candidate) => candidate.prices.length || candidate.phones.length)
  .sort((a, b) => {
    const aScore = Number(Boolean(a.prices.length)) * 5 + Number(Boolean(a.phones.length)) * 3 - a.ageDays / 30;
    const bScore = Number(Boolean(b.prices.length)) * 5 + Number(Boolean(b.phones.length)) * 3 - b.ageDays / 30;
    return bScore - aScore || b.views - a.views;
  });

const report = {
  generatedAt: new Date().toISOString(),
  source: 'TikTok public search via sangzun-han/Tiktok-Api',
  notice: 'Prix et disponibilité à confirmer directement avec chaque fournisseur avant publication.',
  queries,
  rawResultCount: collected.length,
  candidateCount: candidates.length,
  errors,
  candidates,
};

const outputDir = path.resolve('tmp', 'fresh-week');
await mkdir(outputDir, { recursive: true });
const date = new Date().toISOString().slice(0, 10);
const outputPath = path.join(outputDir, `tiktok-suppliers-${date}.json`);
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(outputPath);
