// StripeTerminal stub — the real module requires the paid
// `com.apple.developer.proximity-reader.payment.acceptance`
// entitlement which a free signing team can't use. This file
// provides no-op exports so the rest of the app keeps
// compiling without pulling in `@stripe/stripe-terminal-react-native`.

import React from 'react';

interface TerminalProviderProps {
  children: React.ReactNode;
}

export function TerminalProvider({ children }: TerminalProviderProps) {
  return <>{children}</>;
}

export function useTerminalPayment() {
  return {
    readerStatus: 'disconnected' as const,
    isReaderConnected: false,
    isInitialized: false,
    initError: null as string | null,
    retryInit: async () => {},
    connectReader: async (_eventId?: number) => {},
    collectPayment: async (_clientSecret: string) => {},
    disconnectReader: async () => {},
    lastError: null as string | null,
  };
}
