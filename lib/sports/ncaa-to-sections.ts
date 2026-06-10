import type { NcaaGame, NcaaGameCollection } from '@/lib/types/explore.types';
import { teamColor, sportLabel, sportIcon, sportAccent } from './team-colors';

interface MatchupCard {
  id: string;
  variant: 'matchup';
  status: 'LIVE' | 'FINAL' | 'PRE';
  statusLabel: string;
  away: { abbr: string; color: string; score?: number };
  home: { abbr: string; color: string; score?: number };
  meta?: string;
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  iconName?: string;
  iconColor: string;
  accent: string;
  cards: MatchupCard[];
}

function gameStatus(state: string): 'LIVE' | 'FINAL' | 'PRE' {
  if (state === 'live') return 'LIVE';
  if (state === 'final') return 'FINAL';
  return 'PRE';
}

function statusLabel(game: NcaaGame): string {
  if (game.state === 'live') {
    const clock = game.clockLabel !== '0:00' ? ` ${game.clockLabel}` : '';
    return `LIVE · ${game.periodLabel}${clock}`;
  }
  if (game.state === 'final') {
    return game.finalMessage || 'Final';
  }
  return game.startTimeLabel || 'TBD';
}

function buildSubtitle(games: NcaaGame[]): string {
  const live = games.filter((g) => g.state === 'live').length;
  const total = games.length;
  if (live > 0) return `${live} live · ${total} today`;
  if (total > 0) return `${total} games today`;
  return 'No games today';
}

function gameToCard(game: NcaaGame): MatchupCard {
  return {
    id: game.id,
    variant: 'matchup',
    status: gameStatus(game.state),
    statusLabel: statusLabel(game),
    away: {
      abbr: game.away.abbreviation,
      color: teamColor(game.away.abbreviation),
      score: game.away.score,
    },
    home: {
      abbr: game.home.abbreviation,
      color: teamColor(game.home.abbreviation),
      score: game.home.score,
    },
    meta: game.network || game.bracketRound || undefined,
  };
}

export function ncaaCollectionsToSections(
  collections: NcaaGameCollection[],
): Section[] {
  return collections
    .filter((c) => c.games.length > 0)
    .map((c) => {
      const sorted = [...c.games].sort((a, b) => {
        const order = { live: 0, pre: 1, final: 2 };
        const diff = (order[a.state] ?? 1) - (order[b.state] ?? 1);
        if (diff !== 0) return diff;
        return a.startTimeEpoch - b.startTimeEpoch;
      });

      const cards = sorted.slice(0, 8).map(gameToCard);

      return {
        id: `ncaa-${c.sport}`,
        title: sportLabel(c.sport),
        subtitle: buildSubtitle(c.games),
        iconName: sportIcon(c.sport),
        iconColor: sportAccent(c.sport),
        accent: sportAccent(c.sport),
        cards,
      };
    });
}
