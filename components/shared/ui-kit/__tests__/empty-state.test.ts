// Type-only smoke test — caught at `tsc --noEmit` (no Jest runner).
// Asserts EmptyState props require icon + title + body, all strings.

import { EmptyState, type EmptyStateProps } from '../index';

const _props: EmptyStateProps = {
  icon: 'search',
  title: 'No results',
  body: 'Try adjusting your filters or check back soon.',
};

const _alt: EmptyStateProps = {
  icon: 'cloud-offline',
  title: 'Offline',
  body: 'Reconnect to refresh.',
};

void [_props, _alt];

if (typeof EmptyState !== 'function') {
  throw new Error('EmptyState must be a callable component export');
}

// title + body must be string-typed (not optional, not ReactNode).
type AssertAssignable<T, U extends T> = U;
type _TitleIsString = AssertAssignable<string, EmptyStateProps['title']>;
type _BodyIsString = AssertAssignable<string, EmptyStateProps['body']>;

void [null as unknown as _TitleIsString, null as unknown as _BodyIsString];
