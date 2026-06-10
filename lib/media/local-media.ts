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
  if (!FileSystem.documentDirectory) return uri;
  try {
    const dir = `${FileSystem.documentDirectory}proslync-media/${slot}/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const existing = await FileSystem.readDirectoryAsync(dir).catch(() => [] as string[]);
    await Promise.all(
      existing.map((f) =>
        FileSystem.deleteAsync(`${dir}${f}`, { idempotent: true }).catch(() => {}),
      ),
    );
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

/**
 * Heals a locally-persisted media URI after an app update. iOS rotates the
 * data-container UUID on updates, so absolute file:// URIs go stale while the
 * file itself survives under the new container. Returns:
 *   - the original uri if it still exists (or isn't a file:// uri),
 *   - a re-anchored uri (current documentDirectory + path after /Documents/)
 *     if the file exists there,
 *   - null if the file is truly gone.
 */
export async function healLocalMediaUri(uri: string): Promise<string | null> {
  if (!uri.startsWith('file://')) return uri;
  try {
    if ((await FileSystem.getInfoAsync(uri)).exists) return uri;
  } catch {
    return uri; // can't verify — trust it rather than destroy state
  }
  const docDir = FileSystem.documentDirectory;
  const marker = '/Documents/';
  const idx = uri.indexOf(marker);
  if (docDir && idx !== -1) {
    // documentDirectory ends with a trailing slash, e.g. "file:///…/Documents/"
    // uri.slice(idx + marker.length) strips the leading slash so we get exactly one.
    const reanchored = docDir + uri.slice(idx + marker.length);
    try {
      if ((await FileSystem.getInfoAsync(reanchored)).exists) return reanchored;
    } catch {}
  }
  return null;
}
