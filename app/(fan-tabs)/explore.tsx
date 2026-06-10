// Fan Explore tab — renders the universal ExploreView (3-seg
// Feed / Games / Discover) so fans see the same shared discovery surface
// every persona sees. Updated 2026-05-12 during fan-dashboard-remix to
// drop the standalone DiscoveryBlock wrapper; DiscoveryBlock is already
// nested inside ExploreView's Discover section, so no content is lost.

import * as React from 'react';

import { ExploreView } from '@/components/explore/explore-view';

export default function FanExploreTab() {
  return <ExploreView />;
}
