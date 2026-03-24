import { NativeModule, requireNativeModule } from 'expo';

import { NativeUiExtModuleEvents } from './NativeUiExt.types';

declare class NativeUiExtModule extends NativeModule<NativeUiExtModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<NativeUiExtModule>('NativeUiExt');
