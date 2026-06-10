// Boot-time photo prefetcher.
//
// Walks the sourced URL list (lib/data/photo-sources.json via lib/data/photo-urls.ts)
// and asks expo-image to fetch + disk-cache each one. expo-image's cachePolicy on
// EntityAvatar is already 'memory-disk', so once a URL is loaded the avatar will
// render instantly on subsequent screens.
//
// Deferred behind InteractionManager so it never competes with the first paint.

import { InteractionManager } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

import { ALL_SOURCED_PHOTO_URLS } from '@/lib/data/photo-urls';

let started = false;

export function prefetchSourcedPhotos(): void {
  if (started) return;
  started = true;

  InteractionManager.runAfterInteractions(() => {
    ExpoImage.prefetch([...ALL_SOURCED_PHOTO_URLS], 'memory-disk').catch(() => {
      // Best-effort prefetch — the live <Image>/`<EntityAvatar>` renders handle
      // their own error/fallback paths, so a prefetch miss is non-fatal.
    });
  });
}
