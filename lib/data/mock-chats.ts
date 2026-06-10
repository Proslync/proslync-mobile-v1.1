import type { ChatMessage, ChannelInfo } from "@/hooks/use-conversation";

const now = Date.now();
const m = (mins: number) => new Date(now - mins * 60 * 1000);

type MockThread = {
  info: ChannelInfo;
  messages: ChatMessage[];
};

const MOCK_THREADS: Record<string, MockThread> = {
  "mock-agent-rich": {
    info: {
      id: "mock-agent-rich",
      type: "direct",
      name: "Rich Paul · Klutch",
      imageUrl: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&q=80",
      memberCount: 2,
      isOnline: true,
      members: [],
      otherMember: {
        id: "rp",
        name: "Rich Paul",
        image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&q=80",
        online: true,
        isVerified: true,
        userName: "richpaul",
      },
    },
    messages: [
      { id: "rp-1", text: "Been watching the tape. You've tightened up the handle since fall.", userId: "rp", userName: "Rich Paul", createdAt: m(60 * 28), isOwn: false },
      { id: "rp-2", text: "Still need to shore up the closeouts on the weak side. Coach autry agrees.", userId: "rp", userName: "Rich Paul", createdAt: m(60 * 28 - 2), isOwn: false },
      { id: "rp-3", text: "Appreciate that. I've been working on it every rep", userId: "me", userName: "Kiyan", createdAt: m(60 * 26), isOwn: true },
      { id: "rp-4", text: "Good. Two scouts flew in for Miami. Feedback was 🔥. Top-15 range if you hold.", userId: "rp", userName: "Rich Paul", createdAt: m(60 * 24), isOwn: false },
      { id: "rp-5", text: "You: that's crazy to hear", userId: "me", userName: "Kiyan", createdAt: m(60 * 23), isOwn: true },
      { id: "rp-6", text: "Stay off twitter. Let the work talk.", userId: "rp", userName: "Rich Paul", createdAt: m(60 * 22), isOwn: false },
      { id: "rp-7", text: "Also — Nike wants you on a bigger extension. Marcus is running point.", userId: "rp", userName: "Rich Paul", createdAt: m(180), isOwn: false },
      { id: "rp-8", text: "Talked to the league scout — feedback was 🔥. Call me tonight.", userId: "rp", userName: "Rich Paul", createdAt: m(8), isOwn: false },
    ],
  },
  "mock-agent-marketing": {
    info: {
      id: "mock-agent-marketing",
      type: "direct",
      name: "Marcus · Klutch Marketing",
      memberCount: 2,
      isOnline: true,
      members: [],
      otherMember: {
        id: "mk",
        name: "Marcus",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
        online: true,
        isVerified: true,
      },
    },
    messages: [
      { id: "mk-1", text: "Nike came back. 1yr / $85k + 4% royalty on the MB.04 NY edition.", userId: "mk", userName: "Marcus", createdAt: m(90), isOwn: false },
      { id: "mk-2", text: "How does that compare to the Jordan ask?", userId: "me", userName: "Kiyan", createdAt: m(80), isOwn: true },
      { id: "mk-3", text: "Jordan is $65k + sample tier. But better long-term leverage if you stay.", userId: "mk", userName: "Marcus", createdAt: m(75), isOwn: false },
      { id: "mk-4", text: "And Nike is asking for exclusivity in the sneaker category only — you can still do Beats, Celsius, etc.", userId: "mk", userName: "Marcus", createdAt: m(73), isOwn: false },
      { id: "mk-5", text: "Locking Nike numbers EOD. Need your call on the royalty split.", userId: "mk", userName: "Marcus", createdAt: m(32), isOwn: false },
    ],
  },
  "mock-deal-desk": {
    info: {
      id: "mock-deal-desk",
      type: "direct",
      name: "Proslync Deal Desk",
      memberCount: 2,
      isOnline: true,
      members: [],
      otherMember: {
        id: "desk",
        name: "Proslync Deal Desk",
        image: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=200&q=80",
        online: true,
        isVerified: true,
      },
    },
    messages: [
      { id: "dd-1", text: "New offer routed to you: Nike Hoops · NY Edition signature line.", userId: "desk", userName: "Proslync Deal Desk", createdAt: m(120), isOwn: false },
      { id: "dd-2", text: "Base: $65,000. Performance bonuses up to +$20,000. 2 content deliverables / month.", userId: "desk", userName: "Proslync Deal Desk", createdAt: m(118), isOwn: false },
      { id: "dd-3", text: "Counter sent?", userId: "me", userName: "Kiyan", createdAt: m(95), isOwn: true },
      { id: "dd-4", text: "Klutch countered at $90k + 4% royalty. Brand accepted $85k + 4%.", userId: "desk", userName: "Proslync Deal Desk", createdAt: m(75), isOwn: false },
      { id: "dd-5", text: "Nike upped to $85k + 4% royalty. Pitch deck attached.", userId: "desk", userName: "Proslync Deal Desk", createdAt: m(65), isOwn: false, attachments: [{ type: "image", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80" }] },
    ],
  },
  "mock-jordan": {
    info: {
      id: "mock-jordan",
      type: "group",
      name: "Jordan Brand · NIL",
      memberCount: 3,
      isOnline: false,
      members: [],
    },
    messages: [
      { id: "jb-1", text: "Hey Kiyan — quick ping from the JBC alumni side.", userId: "jb", userName: "Jordan Brand", createdAt: m(60 * 12), isOwn: false },
      { id: "jb-2", text: "Capsule hoodies (black + orange) coming to the Dome Friday 2pm.", userId: "jb", userName: "Jordan Brand", createdAt: m(60 * 10), isOwn: false },
      { id: "jb-3", text: "sizes locked — L for me, M for JJ, XL for Donnie", userId: "me", userName: "Kiyan", createdAt: m(300), isOwn: true },
      { id: "jb-4", text: "Got it. Pulling extras for the team GC just in case.", userId: "jb", userName: "Jordan Brand", createdAt: m(290), isOwn: false },
      { id: "jb-5", text: "Capsule sample hoodies heading to the Dome Friday. Sizes locked?", userId: "jb", userName: "Jordan Brand", createdAt: m(140), isOwn: false },
    ],
  },
  "mock-puma": {
    info: {
      id: "mock-puma",
      type: "direct",
      name: "Nike Hoops · Tosan",
      memberCount: 2,
      isOnline: false,
      members: [],
      otherMember: {
        id: "tosan",
        name: "Tosan Evbuomwan",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80",
        online: false,
        isVerified: true,
      },
    },
    messages: [
      { id: "pm-1", text: "Sent over the MB.04 mockups. Colorway #3 is my favorite.", userId: "tosan", userName: "Tosan", createdAt: m(60 * 8), isOwn: false },
      { id: "pm-2", text: "The Knicks-ish one?", userId: "me", userName: "Kiyan", createdAt: m(60 * 7), isOwn: true },
      { id: "pm-3", text: "Yep — blue / orange / black with the NY midsole.", userId: "tosan", userName: "Tosan", createdAt: m(60 * 7 - 1), isOwn: false },
      { id: "pm-4", text: "Loved the MB.04 colorway — let's do a NY edition", userId: "me", userName: "Kiyan", createdAt: m(280), isOwn: true },
    ],
  },
  "mock-celsius": {
    info: {
      id: "mock-celsius",
      type: "direct",
      name: "Celsius · Partnerships",
      memberCount: 2,
      isOnline: false,
      members: [],
      otherMember: {
        id: "cs",
        name: "Celsius",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80",
        online: false,
        isVerified: true,
      },
    },
    messages: [
      { id: "cs-1", text: "Hey Kiyan — excited to have you on the Gameday series.", userId: "cs", userName: "Celsius", createdAt: m(60 * 10), isOwn: false },
      { id: "cs-2", text: "We'd film a morning shootaround + postgame tunnel cut.", userId: "cs", userName: "Celsius", createdAt: m(60 * 10 - 1), isOwn: false },
      { id: "cs-3", text: "sounds clean. when?", userId: "me", userName: "Kiyan", createdAt: m(60 * 9), isOwn: true },
      { id: "cs-4", text: "Targeting the NC State home game. 2 weeks out.", userId: "cs", userName: "Celsius", createdAt: m(60 * 9 - 1), isOwn: false },
      { id: "cs-5", text: "Content brief for the gameday series dropping tomorrow.", userId: "cs", userName: "Celsius", createdAt: m(410), isOwn: false },
    ],
  },
  "mock-beats": {
    info: {
      id: "mock-beats",
      type: "direct",
      name: "Beats by Dre · Claire",
      memberCount: 2,
      isOnline: false,
      members: [],
      otherMember: {
        id: "beats",
        name: "Claire",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80",
        online: false,
        isVerified: true,
      },
    },
    messages: [
      { id: "bt-1", text: "Melo mentioned you've been writing. Want to get you in the studio.", userId: "beats", userName: "Claire · Beats", createdAt: m(60 * 14), isOwn: false },
      { id: "bt-2", text: "Literally been hoping for this lol 🙏", userId: "me", userName: "Kiyan", createdAt: m(60 * 13), isOwn: true },
      { id: "bt-3", text: "Haha. NYC the 19th — we'll send a car from Cuse.", userId: "beats", userName: "Claire · Beats", createdAt: m(60 * 12), isOwn: false },
      { id: "bt-4", text: "Studio session in NYC next Tues — you in?", userId: "beats", userName: "Claire · Beats", createdAt: m(620), isOwn: false },
    ],
  },
  "mock-cuse-gc": {
    info: {
      id: "mock-cuse-gc",
      type: "group",
      name: "Cuse Hoops 🧡",
      memberCount: 13,
      isOnline: false,
      members: [],
    },
    messages: [
      { id: "gc-1", text: "film tonight @ 7 — watch the Miami pnr tape", userId: "autry", userName: "Coach Autry", createdAt: m(60 * 4), isOwn: false },
      { id: "gc-2", text: "bet 🫡", userId: "me", userName: "Kiyan", createdAt: m(60 * 4 - 1), isOwn: true },
      { id: "gc-3", text: "who wants to shoot after", userId: "jj", userName: "JJ", createdAt: m(60 * 3), isOwn: false },
      { id: "gc-4", text: "i'm in", userId: "donnie", userName: "Donnie", createdAt: m(60 * 3 - 1), isOwn: false },
      { id: "gc-5", text: "i'm down too", userId: "ng", userName: "Naithan", createdAt: m(720 + 10), isOwn: false },
      { id: "gc-6", text: "bus leaves 4:45 sharp fellas. Don't be late 🏀", userId: "jj", userName: "JJ", createdAt: m(720), isOwn: false },
    ],
  },
  "mock-jj": {
    info: {
      id: "mock-jj",
      type: "direct",
      name: "JJ Starling",
      memberCount: 2,
      isOnline: true,
      members: [],
      otherMember: {
        id: "jj",
        name: "JJ Starling",
        image: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&q=80",
        online: true,
      },
    },
    messages: [
      { id: "jj-1", text: "bro that stepback in the 2nd half was a problem 😂", userId: "jj", userName: "JJ", createdAt: m(60 * 20), isOwn: false },
      { id: "jj-2", text: "felt good. matched the Coop game from January", userId: "me", userName: "Kiyan", createdAt: m(60 * 19), isOwn: true },
      { id: "jj-3", text: "🫡 you still holding film room?", userId: "jj", userName: "JJ", createdAt: m(60 * 17), isOwn: false },
      { id: "jj-4", text: "ya. 9am tomorrow", userId: "me", userName: "Kiyan", createdAt: m(60 * 16), isOwn: true },
      { id: "jj-5", text: "Open gym at 9? We running 3s", userId: "jj", userName: "JJ", createdAt: m(860), isOwn: false },
    ],
  },
  "mock-donnie": {
    info: {
      id: "mock-donnie",
      type: "direct",
      name: "Donnie Freeman",
      memberCount: 2,
      isOnline: false,
      members: [],
      otherMember: {
        id: "donnie",
        name: "Donnie Freeman",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
        online: false,
      },
    },
    messages: [
      { id: "dn-1", text: "shoot-around?", userId: "donnie", userName: "Donnie", createdAt: m(60 * 20), isOwn: false },
      { id: "dn-2", text: "yea. 30 min. meet at the facility", userId: "me", userName: "Kiyan", createdAt: m(60 * 20 - 5), isOwn: true },
      { id: "dn-3", text: "🔑", userId: "donnie", userName: "Donnie", createdAt: m(60 * 20 - 6), isOwn: false },
      { id: "dn-4", text: "bet. meet at the facility 🔑", userId: "me", userName: "Kiyan", createdAt: m(1120), isOwn: true },
    ],
  },
  "mock-naithan": {
    info: {
      id: "mock-naithan",
      type: "direct",
      name: "Naithan George",
      memberCount: 2,
      isOnline: false,
      members: [],
      otherMember: {
        id: "ng",
        name: "Naithan George",
        image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80",
        online: false,
      },
    },
    messages: [
      { id: "ng-1", text: "peep the pnr read on the 3rd possession", userId: "ng", userName: "Naithan", createdAt: m(60 * 25), isOwn: false, attachments: [{ type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbUrl: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80" }] },
      { id: "ng-2", text: "💯 that's a read the PG has to make", userId: "me", userName: "Kiyan", createdAt: m(60 * 25 - 10), isOwn: true },
      { id: "ng-3", text: "film clip — peep the PNR read on 3", userId: "ng", userName: "Naithan", createdAt: m(1480), isOwn: false, attachments: [{ type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbUrl: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80" }] },
    ],
  },
  "mock-lucas": {
    info: {
      id: "mock-lucas",
      type: "direct",
      name: "Lucas Taylor",
      memberCount: 2,
      isOnline: false,
      members: [],
      otherMember: {
        id: "lt",
        name: "Lucas Taylor",
        image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=80",
        online: false,
      },
    },
    messages: [
      { id: "lt-1", text: "coach said rest the legs today", userId: "lt", userName: "Lucas", createdAt: m(60 * 38), isOwn: false },
      { id: "lt-2", text: "finally 😴", userId: "me", userName: "Kiyan", createdAt: m(60 * 37), isOwn: true },
      { id: "lt-3", text: "lift pushed to 7. coach said rest the legs today.", userId: "lt", userName: "Lucas", createdAt: m(2160), isOwn: false },
    ],
  },
};

export function isMockConversation(id: string | undefined | null): boolean {
  return !!id && id.startsWith("mock-");
}

export function getMockChannelInfo(id: string): ChannelInfo | undefined {
  return MOCK_THREADS[id]?.info;
}

export function getMockMessages(id: string): ChatMessage[] {
  return MOCK_THREADS[id]?.messages ?? [];
}

// Local-asset avatars for specific mock contacts (used when a hand-picked
// photo should render instead of the remote Unsplash placeholder).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LOCAL_AVATARS: Record<string, any> = {
  "mock-agent-rich": require("@/assets/images/contact-rich-paul.png"),
  "mock-deal-desk": require("@/assets/images/contact-proslync.png"),
  "mock-celsius": require("@/assets/images/contact-celsius.png"),
  "mock-puma": require("@/assets/images/contact-puma.png"),
  "mock-beats": require("@/assets/images/contact-beats.png"),
  "mock-cuse-gc": require("@/assets/images/contact-cuse.png"),
};

export function getLocalAvatar(id: string | undefined | null): any {
  if (!id) return undefined;
  return LOCAL_AVATARS[id];
}
