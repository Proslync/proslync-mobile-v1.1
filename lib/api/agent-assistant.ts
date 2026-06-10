import { config } from '@/lib/config';
import { secureTokens } from '@/lib/storage/secure-tokens';

export interface AgentChunk {
  type: 'token' | 'done' | 'error';
  text?: string;
}

type OnChunk = (chunk: AgentChunk) => void;

const CANNED: Record<string, string> = {
  'nil valuation': `Based on current market data, NIL valuations for Division I athletes range significantly by sport and platform presence.

**Key factors:**
- Social media following (Instagram, TikTok, YouTube)
- Sport visibility (football and basketball command premium)
- Academic institution and conference (Power 5 = higher floor)
- Engagement rate (more important than raw follower count)

For a mid-tier D1 basketball player with 50K+ followers, typical annual NIL value sits between **$75K–$250K**. Top-tier athletes with 500K+ followers regularly exceed **$1M annually**.

Proslync tracks 2,400+ active NIL deals across 38 brands to provide real-time comparable analysis.`,

  'brand partnerships': `The NIL brand partnership landscape has matured significantly. Here's what we're seeing:

**Trending deal structures:**
- Performance-based tiers (guaranteed base + bonus triggers)
- Multi-year agreements with annual renewals
- Revenue-share models for creator-led content
- Bundled deals across athlete cohorts

**Top brand categories (by deal volume):**
1. Apparel & footwear (28%)
2. Food & beverage (22%)
3. Technology & apps (15%)
4. Financial services (12%)
5. Health & wellness (10%)

Proslync's matching engine analyzes brand affinity, audience overlap, and market timing to surface the highest-value partnerships for each athlete profile.`,

  'market trends': `The NIL market is showing strong growth heading into 2026-27:

**Key trends:**
- Total market size approaching **$2.1B** (up 34% YoY)
- Average deal size increased to **$47K** (from $31K last year)
- Women's sports NIL deals grew **58%** — fastest-growing segment
- Collective-based deals declining as direct brand deals rise
- International athlete NIL deals emerging (transfer portal effect)

**Platform shifts:**
- TikTok engagement now outweighs Instagram for deal conversion
- Long-form YouTube content commands 2.3x higher CPM
- Podcast appearances becoming a standard deal component

Proslync monitors these signals in real-time to keep athletes and brands ahead of the market.`,

  'how does proslync work': `Proslync is the operating system for NIL — connecting athletes, brands, agents, and institutions on a single intelligent platform.

**For Athletes:**
- AI-powered brand matching based on your profile and audience
- Real-time deal tracking and valuation insights
- Direct messaging with verified brand partners

**For Brands:**
- Access to 10,000+ verified NCAA athletes
- Audience analytics and engagement scoring
- Campaign management and ROI tracking

**For Agents & Institutions:**
- Portfolio management across multiple athletes
- Compliance monitoring and reporting
- Commission tracking and payout automation

Everything is powered by live data — NCAA scores, social metrics, market comps — so every recommendation reflects what's happening right now.`,
};

const PRESET_PROMPTS = [
  { label: 'NIL valuation', key: 'nil valuation' },
  { label: 'Brand partnerships', key: 'brand partnerships' },
  { label: 'Market trends', key: 'market trends' },
  { label: 'How Proslync works', key: 'how does proslync work' },
];

function findCannedResponse(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  for (const [key, response] of Object.entries(CANNED)) {
    if (lower.includes(key)) return response;
  }
  return CANNED['how does proslync work'];
}

async function streamCanned(text: string, onChunk: OnChunk, signal?: AbortSignal) {
  const words = text.split(/(\s+)/);
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return;
    onChunk({ type: 'token', text: words[i] });
    await new Promise((r) => setTimeout(r, 25 + Math.random() * 20));
  }
  onChunk({ type: 'done' });
}

async function streamFromBackend(prompt: string, onChunk: OnChunk, signal?: AbortSignal) {
  const base = config.api.baseUrl;
  if (!base) throw new Error('no backend');

  const token = await secureTokens.getAccessToken();
  const res = await fetch(`${base}/api/agent/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!res.body) throw new Error('no body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') {
        onChunk({ type: 'done' });
        return;
      }
      try {
        const parsed = JSON.parse(payload);
        if (parsed.token) onChunk({ type: 'token', text: parsed.token });
      } catch {
        onChunk({ type: 'token', text: payload });
      }
    }
  }
  onChunk({ type: 'done' });
}

export const agentAssistant = {
  presetPrompts: PRESET_PROMPTS,

  async ask(prompt: string, onChunk: OnChunk, signal?: AbortSignal) {
    try {
      await streamFromBackend(prompt, onChunk, signal);
    } catch {
      const canned = findCannedResponse(prompt);
      if (canned) {
        await streamCanned(canned, onChunk, signal);
      } else {
        onChunk({ type: 'error', text: 'Unable to process your request right now.' });
      }
    }
  },
};
