// Fan Hub — slot-2 of the fan-tabs spine. Always renders <FanView /> so the
// 3-pill segmented control (Home / Pick'em / Perks) is visible regardless
// of fan-auth state. The prior auth-branched FanHomeFeed/FanView split was
// dropped during fan-dashboard-remix-2026-05-12 per user direction: "we
// were supposed to take the direct old home page and the 3 things it had
// and implement it" — the 3 things being the Home/Pick'em/Perks pills.
//
// FanHomeFeed (real `/api/fan/feed/home` consumer) is now mounted as
// FanView's Home segment, replacing the mocked FollowingFeed.

import * as React from 'react';

import { FanView } from '@/components/fan/fan-view';

export default function FanHubTab() {
  return <FanView />;
}
