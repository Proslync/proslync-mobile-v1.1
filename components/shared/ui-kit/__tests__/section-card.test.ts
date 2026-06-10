// Type-only smoke test — caught at `tsc --noEmit` (no Jest runner).
// Asserts SectionCard props accept title + icon + optional iconColor + children.

import * as React from 'react';

import { SectionCard, type SectionCardProps } from '../index';

const _minimal: SectionCardProps = {
  title: 'OVERVIEW',
  icon: 'sparkles',
  children: null,
};

const _withIconColor: SectionCardProps = {
  title: 'COMPLIANCE',
  icon: 'shield-checkmark',
  iconColor: '#00C6B0',
  children: React.createElement('div'),
};

// children accepts any ReactNode, including arrays + strings.
const _withArrayChildren: SectionCardProps = {
  title: 'STACK',
  icon: 'layers',
  children: ['one', 'two'],
};

void [_minimal, _withIconColor, _withArrayChildren];

if (typeof SectionCard !== 'function') {
  throw new Error('SectionCard must be a callable component export');
}
