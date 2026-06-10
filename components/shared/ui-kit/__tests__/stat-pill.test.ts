// Type-only smoke test — caught at `tsc --noEmit` (no Jest runner).
// Asserts StatPill props accept value/label + both sizes + optional tint.

import {
  StatPill,
  type StatPillProps,
  type StatPillSize,
} from '../index';

type AssertAssignable<T, U extends T> = U;
type _Sizes = AssertAssignable<StatPillSize, 'sm' | 'md'>;
type _SizesReverse = AssertAssignable<'sm' | 'md', StatPillSize>;

const _sm: StatPillProps = { value: '12', label: 'GAMES', size: 'sm' };
const _md: StatPillProps = { value: '$48K', label: 'EARNED', size: 'md' };
const _tinted: StatPillProps = { value: '3', label: 'LIVE', tint: '#00C6B0' };
const _minimal: StatPillProps = { value: '0', label: 'OPEN' };

void [_sm, _md, _tinted, _minimal];

if (typeof StatPill !== 'function') {
  throw new Error('StatPill must be a callable component export');
}

void [null as unknown as _Sizes, null as unknown as _SizesReverse];
