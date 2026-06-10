import * as FileSystem from 'expo-file-system/legacy';

export type LocalMediaType = 'image' | 'video';

export type LocalMedia = { uri: string; type: LocalMediaType };

/**
 * Copies a picked asset (image/video) into the app's persistent
 * documentDirectory under proslync-media/<slot>/ so the URI survives app
 * restarts. The picker's returned URI typically points to a temp/cache file
 * that gets purged.
 */
export async function persistLocalMedia(
  uri: string,
  slot: string,
  kind: LocalMediaType,
): Promise<string> {
  try {
    const dir = `${FileSystem.documentDirectory}proslync-media/${slot}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const fallbackExt = kind === 'video' ? 'mp4' : 'jpg';
    const ext = (uri.split('?')[0].split('.').pop() || fallbackExt).toLowerCase();
    const safeExt = /^[a-z0-9]{2,4}$/.test(ext) ? ext : fallbackExt;
    const dest = `${dir}${Date.now()}.${safeExt}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    // If copy fails, fall back to the original URI — better than nothing.
    return uri;
  }
}

/**
 * True if a locally-persisted media URI still points at an existing file.
 * Non-file URIs (https, bundled) are always considered alive. If the check
 * itself fails, we trust the URI rather than destroying user state.
 */
export async function isLocalMediaAlive(uri: string): Promise<boolean> {
  if (!uri.startsWith('file://')) return true;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return true;
  }
}
