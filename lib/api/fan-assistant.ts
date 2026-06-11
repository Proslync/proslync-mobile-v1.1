// Fan-facing assistant — canned corpus + same streaming/chunk interface as
// agent-assistant.ts. No backend call is made (fans don't have auth tokens for
// the agent endpoint). Falls back to the canned corpus with the same token-by-
// token simulation so the UX feels identical.

export interface AgentChunk {
  type: 'token' | 'done' | 'error';
  text?: string;
}

type OnChunk = (chunk: AgentChunk) => void;

// ─────────────────────────────────────────────────────────────────────────────
// Corpus
// ─────────────────────────────────────────────────────────────────────────────

const CANNED: Array<{ keys: string[]; response: string }> = [
  {
    keys: [
      'support', 'how do i support', 'back an athlete', 'give money', 'donate',
      'contribute', 'fund', 'help an athlete',
    ],
    response: `**Supporting an athlete on Proslync**

Head to any athlete's profile and tap the **Support** button. You'll see their available support tiers — each one is a real NIL transaction, not a donation.

- Choose a tier (content access, shoutout, appearance, merch, or just a direct backing)
- Complete the purchase through the secure checkout
- You'll receive a **receipt showing exactly what reached the athlete**

Every dollar is tracked. No middleman skimming. The athlete sees it, you see it.`,
  },
  {
    keys: [
      'rules', 'limit', 'how much can i give', 'legal', 'cap', 'regulation',
      'compliance', 'nil rules', 'fan rules', 'booster', 'allowed',
    ],
    response: `**Fan NIL rules — the short version**

- **No dollar cap** — you can spend as much as you want, but every purchase must buy something real (content, merch, appearances). That's what makes it a legal NIL deal.
- **$600+ transactions** get reported to the NIL Go clearinghouse for compliance tracking.
- **Small purchases under ~$2,500** are generally light-touch with minimal scrutiny.
- **$50K+** directed toward athletes at one school can classify you as a **booster**, which comes with extra NCAA oversight.
- **Nothing can be tied to recruiting or game performance** — that's still off-limits.

_General info — not legal advice._`,
  },
  {
    keys: [
      'what is nil', 'nil meaning', 'nil explained', 'name image likeness',
      'what does nil mean', 'nil definition', 'house settlement',
    ],
    response: `**NIL = Name, Image, Likeness**

College athletes can now earn money from who they are — their name, their face, their social following, their brand.

- Signed into law in 2021; athletes in all 50 states can participate.
- The **House settlement (2025)** went further: schools can now directly share revenue with athletes.
- Third-party deals (that's where fans and brands come in) go through compliance review to make sure they follow the rules.

Proslync is built specifically to make fan-to-athlete NIL deals transparent, fast, and fair.`,
  },
  {
    keys: [
      'where does my money go', 'receipts', 'cut', 'breakdown', 'fees',
      'how much does the athlete get', 'platform fee', 'transparency',
      'proof', 'collective',
    ],
    response: `**Where your money goes**

When you back an athlete on Proslync:

- **The athlete keeps the large majority** of every transaction
- A **transparent platform fee** is shown before you confirm — no surprises
- You get a **receipt per transaction** that shows the exact split

For context: traditional NIL collectives have historically skimmed **20–30%** with zero documentation. Proslync shows you the proof every time.`,
  },
  {
    keys: [
      'transfer', 'portal', 'transfer portal', 'player moved', 'changed schools',
      'new school', 'follows', 'loyalty',
    ],
    response: `**Athletes in the transfer portal**

Your support and connection travel with the player, not the school.

When an athlete you back enters the transfer portal and commits to a new program, **follow them on Proslync** — your history with them stays intact and you'll see their new content and support tiers on their updated profile.

Support the person, not the jersey.`,
  },
  {
    keys: [
      'merch', 'merchandise', 'gear', 'apparel', 'buy gear', 'athlete store',
      'notify', 'shop',
    ],
    response: `**Athlete merch**

Athlete merchandise lives on their profile under the **Merch tab**.

- Tap **Notify** on any item you want — you'll get a push when it drops or restocks
- Merch purchases count as NIL transactions with receipts
- Each piece is specific to that athlete (not generic team gear)`,
  },
  {
    keys: [
      'tickets', 'games', 'schedule', 'when do they play', 'next game',
      'this week', 'upcoming',
    ],
    response: `**Games and schedules**

Check the **team section** on the athlete's profile and the **This Week** area on their page for upcoming games. You can also tap into any sport section on the home feed for live scores and schedules.`,
  },
  {
    keys: [
      'who are you', 'what can you do', 'what is this', 'help', 'what can i ask',
      'proslync assistant', 'what do you know',
    ],
    response: `**Proslync Assistant — here for fans**

I can help you with:

- **Supporting athletes** — how to back them, what tiers mean
- **NIL rules for fans** — what's allowed, limits, booster rules
- **Where your money goes** — breakdowns, receipts, platform fees
- **Merch** — finding athlete gear and setting up notifications
- **Transfer portal** — following athletes across schools
- **Games & schedules** — where to find upcoming matchups

Just ask in plain language — I'll do my best to answer clearly.`,
  },
];

const DEFAULT_FALLBACK = `I can help with **supporting athletes**, **NIL rules**, **where your money goes**, and **merch** — try asking one of those.`;

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion chips exported for the sheet
// ─────────────────────────────────────────────────────────────────────────────

export const FAN_SUGGESTIONS: string[] = [
  'How do I support an athlete?',
  'Is there a limit on what I can give?',
  'Where does my money go?',
  'What is NIL?',
];

// ─────────────────────────────────────────────────────────────────────────────
// Matching + streaming
// ─────────────────────────────────────────────────────────────────────────────

function findCannedResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  for (const entry of CANNED) {
    if (entry.keys.some((k) => lower.includes(k))) {
      return entry.response;
    }
  }
  return DEFAULT_FALLBACK;
}

async function streamCanned(text: string, onChunk: OnChunk, signal?: AbortSignal) {
  const words = text.split(/(\s+)/);
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return;
    onChunk({ type: 'token', text: words[i] });
    await new Promise<void>((r) => setTimeout(r, 25 + Math.random() * 20));
  }
  onChunk({ type: 'done' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — mirrors agentAssistant shape exactly
// ─────────────────────────────────────────────────────────────────────────────

export const fanAssistant = {
  /** Suggestion chips to show when the thread is empty. */
  suggestions: FAN_SUGGESTIONS,

  async ask(prompt: string, onChunk: OnChunk, signal?: AbortSignal): Promise<void> {
    const canned = findCannedResponse(prompt);
    await streamCanned(canned, onChunk, signal);
  },
};
