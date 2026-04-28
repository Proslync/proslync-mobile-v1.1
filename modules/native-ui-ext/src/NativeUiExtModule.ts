import { NativeModule, requireNativeModule } from 'expo';

import { NativeUiExtModuleEvents } from './NativeUiExt.types';

declare class NativeUiExtModule extends NativeModule<NativeUiExtModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// requireNativeModule throws at module-load time if the native module isn't
// registered. That would crash the whole app at startup before React mounts,
// so wrap it and export a safe stub if loading fails.
const loadModule = (): NativeUiExtModule | null => {
  try {
    return requireNativeModule<NativeUiExtModule>('NativeUiExt');
  } catch (err) {
    console.warn('[NativeUiExt] native module unavailable:', err);
    return null;
  }
};

export default loadModule() as NativeUiExtModule;
