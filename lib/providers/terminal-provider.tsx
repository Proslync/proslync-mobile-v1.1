import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  StripeTerminalProvider as NativeTerminalProvider,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import type { Reader } from '@stripe/stripe-terminal-react-native';
import { paymentsApi } from '@/lib/api/payments';

type ReaderStatus = 'disconnected' | 'connecting' | 'connected';

interface TerminalPaymentContextValue {
  readerStatus: ReaderStatus;
  isReaderConnected: boolean;
  isInitialized: boolean;
  initError: string | null;
  retryInit: () => Promise<void>;
  connectReader: (locationId?: string) => Promise<void>;
  collectPayment: (clientSecret: string) => Promise<void>;
  cancelCollect: () => Promise<void>;
}

const TerminalPaymentContext = createContext<TerminalPaymentContextValue | null>(null);

function TerminalPaymentInner({ children }: { children: React.ReactNode }) {
  const {
    initialize,
    isInitialized,
    discoverReaders,
    discoveredReaders,
    connectedReader,
    connectReader: sdkConnectReader,
    collectPaymentMethod,
    confirmPaymentIntent,
    retrievePaymentIntent,
    cancelCollectPaymentMethod,
  } = useStripeTerminal();

  const [readerStatus, setReaderStatus] = useState<ReaderStatus>('disconnected');
  const [initError, setInitError] = useState<string | null>(null);
  const isConnectingRef = useRef(false);
  const resolveDiscoveryRef = useRef<((readers: Reader.Type[]) => void) | null>(null);

  // Initialize SDK — must complete before any other SDK calls
  const doInit = useCallback(async () => {
    try {
      setInitError(null);
      const { error } = await initialize();
      if (error) {
        console.error('[Terminal] Initialize error:', error);
        setInitError(error.message || 'Failed to initialize Terminal SDK');
      }
    } catch (err: any) {
      console.error('[Terminal] Initialize exception:', err);
      setInitError(err?.message || 'Failed to initialize Terminal SDK');
    }
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) {
      doInit();
    }
  }, [isInitialized, doInit]);

  // When discovered readers update, resolve any pending discovery promise
  useEffect(() => {
    if (discoveredReaders.length > 0 && resolveDiscoveryRef.current) {
      resolveDiscoveryRef.current(discoveredReaders);
      resolveDiscoveryRef.current = null;
    }
  }, [discoveredReaders]);

  // Track connected reader status
  useEffect(() => {
    if (connectedReader) {
      setReaderStatus('connected');
    }
  }, [connectedReader]);

  const connectReader = useCallback(async (locationId?: string) => {
    if (isConnectingRef.current || readerStatus === 'connected') return;
    if (!isInitialized) {
      throw new Error('Terminal SDK not initialized yet');
    }

    isConnectingRef.current = true;
    setReaderStatus('connecting');

    try {
      // Set up the reader waiting promise BEFORE starting discovery
      // to avoid a race condition where discoveredReaders updates
      // before the promise listener is registered.
      const readersPromise = new Promise<Reader.Type[]>((resolve, reject) => {
        resolveDiscoveryRef.current = resolve;
        setTimeout(() => {
          resolveDiscoveryRef.current = null;
          reject(new Error('Timed out waiting for Tap to Pay reader'));
        }, 15000);
      });

      // Start discovery — readers arrive via discoveredReaders prop
      const { error: discoverError } = await discoverReaders({
        discoveryMethod: 'tapToPay',
        simulated: false,
      });

      if (discoverError) {
        throw new Error(discoverError.message);
      }

      // If readers were already discovered (e.g. from a previous attempt),
      // use them directly; otherwise wait for the discovery callback.
      let readers = discoveredReaders;
      if (readers.length === 0) {
        readers = await readersPromise;
      } else {
        // Clean up the unused promise
        resolveDiscoveryRef.current = null;
      }

      if (readers.length === 0) {
        throw new Error('No Tap to Pay reader found on this device');
      }

      const reader = readers[0];
      const { error: connectError } = await sdkConnectReader(
        {
          reader,
          locationId: locationId || undefined,
          merchantDisplayName: 'Status',
          tosAcceptancePermitted: true,
          autoReconnectOnUnexpectedDisconnect: true,
        },
        'tapToPay'
      );

      if (connectError) {
        throw new Error(connectError.message);
      }

      setReaderStatus('connected');
    } catch (err) {
      console.error('[Terminal] Connect error:', err);
      setReaderStatus('disconnected');
      throw err;
    } finally {
      isConnectingRef.current = false;
    }
  }, [readerStatus, isInitialized, discoverReaders, discoveredReaders, sdkConnectReader]);

  const collectPayment = useCallback(
    async (clientSecret: string) => {
      // Retrieve the PaymentIntent from the client secret
      const { paymentIntent, error: retrieveError } =
        await retrievePaymentIntent(clientSecret);

      if (retrieveError || !paymentIntent) {
        throw new Error(retrieveError?.message || 'Failed to retrieve payment intent');
      }

      // Collect payment method (shows NFC "Ready to tap" UI)
      const { paymentIntent: collectedIntent, error: collectError } =
        await collectPaymentMethod({ paymentIntent });

      if (collectError) {
        if (collectError.code === 'Canceled') {
          throw new Error('Payment collection canceled');
        }
        throw new Error(collectError.message);
      }

      if (!collectedIntent) {
        throw new Error('No payment intent returned after collection');
      }

      // Confirm the payment
      const { paymentIntent: confirmedIntent, error: confirmError } =
        await confirmPaymentIntent({ paymentIntent: collectedIntent });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (!confirmedIntent) {
        throw new Error('Payment confirmation failed');
      }
    },
    [retrievePaymentIntent, collectPaymentMethod, confirmPaymentIntent]
  );

  const cancelCollect = useCallback(async () => {
    try {
      await cancelCollectPaymentMethod();
    } catch {
      // Ignore cancel errors
    }
  }, [cancelCollectPaymentMethod]);

  const value = useMemo(
    () => ({
      readerStatus,
      isReaderConnected: readerStatus === 'connected',
      isInitialized,
      initError,
      retryInit: doInit,
      connectReader,
      collectPayment,
      cancelCollect,
    }),
    [readerStatus, isInitialized, initError, doInit, connectReader, collectPayment, cancelCollect]
  );

  return (
    <TerminalPaymentContext.Provider value={value}>
      {children}
    </TerminalPaymentContext.Provider>
  );
}

interface TerminalProviderProps {
  children: React.ReactNode;
}

const fetchTokenProvider = async () => {
  return await paymentsApi.fetchConnectionToken();
};

export function TerminalProvider({ children }: TerminalProviderProps) {
  // Terminal Tap to Pay is iOS only
  if (Platform.OS !== 'ios') {
    return <>{children}</>;
  }

  return (
    <NativeTerminalProvider
      logLevel={__DEV__ ? 'verbose' : 'none'}
      tokenProvider={fetchTokenProvider}
    >
      <TerminalPaymentInner>{children}</TerminalPaymentInner>
    </NativeTerminalProvider>
  );
}

export function useTerminalPayment(): TerminalPaymentContextValue {
  const context = useContext(TerminalPaymentContext);
  if (!context) {
    // Return a no-op implementation for non-iOS platforms
    return {
      readerStatus: 'disconnected',
      isReaderConnected: false,
      isInitialized: false,
      initError: Platform.OS !== 'ios' ? 'Tap to Pay is only available on iPhone' : null,
      retryInit: async () => {},
      connectReader: async (_locationId?: string) => {},
      collectPayment: async () => {
        throw new Error('Tap to Pay is only available on iPhone');
      },
      cancelCollect: async () => {},
    };
  }
  return context;
}
