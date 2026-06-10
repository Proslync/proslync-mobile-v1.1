import type { ImageSourcePropType } from 'react-native';
import { CURATED_MEDIA } from './curated-manifest';
import type { LocalMedia } from './local-media';

export type ResolvedMedia =
  | { kind: 'local'; type: 'image' | 'video'; uri: string }
  | { kind: 'curated-image'; type: 'image'; source: ImageSourcePropType }
  | { kind: 'curated-video'; type: 'video'; uri: string }
  | { kind: 'none' };

/**
 * Resolution order for a media slot:
 *   1. local user pick (validated by the screen at hydration time)
 *   2. curated default baked into the build
 *   3. 'none' — caller renders its legacy fallback
 */
export function resolveSlotMedia(slot: string, local: LocalMedia | null): ResolvedMedia {
  if (local) return { kind: 'local', type: local.type, uri: local.uri };
  const curated = CURATED_MEDIA[slot];
  if (curated) {
    return curated.type === 'image'
      ? { kind: 'curated-image', type: 'image', source: curated.source }
      : { kind: 'curated-video', type: 'video', uri: curated.uri };
  }
  return { kind: 'none' };
}

/**
 * Avatar-specific resolution: local pick → curated 'profile-avatar' slot →
 * server avatar URL → caller's bundled fallback. Always returns a renderable
 * Image source.
 */
export function resolveAvatarSource(
  localUri: string | null,
  serverUrl: string | null | undefined,
  fallback: ImageSourcePropType,
): ImageSourcePropType {
  if (localUri) return { uri: localUri };
  const curated = CURATED_MEDIA['profile-avatar'];
  if (curated) return curated.type === 'image' ? curated.source : { uri: curated.uri };
  if (serverUrl) return { uri: serverUrl };
  return fallback;
}
