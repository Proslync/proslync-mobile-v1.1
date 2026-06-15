// Single game page — one route renders the shared GamePageShell with a
// segmented switcher (Box Score / Highlights / Schedule) and swaps the matching
// content component in-place via local tab state. The optional `tab` param sets
// the initial section so deep-links open the right tab, but switching once here
// never changes the route or re-animates the header.

import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';

import { BoxScoreContent } from '@/components/game/box-score-content';
import { GamePageShell, type GameTab } from '@/components/game/game-page-shell';
import { HighlightsContent } from '@/components/game/highlights-content';
import { ScheduleContent } from '@/components/game/schedule-content';
import { getGame } from '@/lib/data/mock-games';

const TABS: GameTab[] = ['box-score', 'highlights', 'schedule'];

export default function GameScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const game = React.useMemo(() => getGame(id ?? ''), [id]);

  const initial: GameTab = TABS.includes(tab as GameTab) ? (tab as GameTab) : 'box-score';
  const [active, setActive] = React.useState<GameTab>(initial);

  return (
    <GamePageShell game={game} active={active} onSelect={setActive}>
      {active === 'box-score' ? <BoxScoreContent game={game} /> : null}
      {active === 'highlights' ? <HighlightsContent game={game} /> : null}
      {active === 'schedule' ? <ScheduleContent game={game} /> : null}
    </GamePageShell>
  );
}
