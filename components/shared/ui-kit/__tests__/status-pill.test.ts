// Type-only smoke test — caught at `tsc --noEmit` (no Jest runner).
// Asserts StatusPill props accept every Tone + both sizes + optional icon.

import {
  StatusPill,
  type StatusPillProps,
  type StatusPillSize,
  type Tone,
} from '../index';

type AssertAssignable<T, U extends T> = U;
type _Sizes = AssertAssignable<StatusPillSize, 'sm' | 'md'>;
type _SizesReverse = AssertAssignable<'sm' | 'md', StatusPillSize>;

const tones: Tone[] = ['success', 'warning', 'danger', 'muted', 'accent', 'info'];

for (const tone of tones) {
  const _smProps: StatusPillProps = { label: 'LIVE', tone, size: 'sm' };
  const _mdProps: StatusPillProps = { label: 'LIVE', tone, size: 'md' };
  const _withIcon: StatusPillProps = { label: 'LIVE', tone, icon: 'flash' };
  const _colorOverride: StatusPillProps = { label: 'X', color: '#EB621A' };
  void [_smProps, _mdProps, _withIcon, _colorOverride];
}

// `label` is required.
const _minimal: StatusPillProps = { label: 'NEW' };
void _minimal;

if (typeof StatusPill !== 'function') {
  throw new Error('StatusPill must be a callable component export');
}

void [null as unknown as _Sizes, null as unknown as _SizesReverse];
