// Hook for Tap to Pay flow using Stripe Terminal SDK
import { useCallback, useRef, useState } from "react";
import {
  useStripeTerminal,
  type Reader,
} from "@stripe/stripe-terminal-react-native";
import { terminalApi } from "@/lib/api/terminal";
import type { CreateTerminalPaymentIntentRequest } from "@/lib/types/terminal.types";

type TapToPayStatus =
  | "idle"
  | "discovering"
  | "connecting"
  | "ready"
  | "collecting"
  | "processing"
  | "success"
  | "error";

export function useTapToPay(eventId: number | null) {
  const {
    discoverReaders,
    connectLocalMobileReader,
    retrievePaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
    cancelDiscovering,
  } = useStripeTerminal();

  const [status, setStatus] = useState<TapToPayStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [reader, setReader] = useState<Reader.Type | null>(null);
  const readerRef = useRef<Reader.Type | null>(null);

  /**
   * Discover and connect to the local mobile reader (iPhone NFC).
   */
  const connect = useCallback(
    async (locationId: string) => {
      try {
        setStatus("discovering");
        setError(null);

        const { readers, error: discoverError } = await discoverReaders({
          discoveryMethod: "localMobile",
          simulated: false,
        });

        if (discoverError) {
          throw new Error(discoverError.message);
        }

        if (!readers || readers.length === 0) {
          throw new Error(
            "No local mobile readers found. Make sure Tap to Pay is supported on this device.",
          );
        }

        setStatus("connecting");

        const { reader: connectedReader, error: connectError } =
          await connectLocalMobileReader({
            reader: readers[0],
            locationId,
          });

        if (connectError) {
          throw new Error(connectError.message);
        }

        if (connectedReader) {
          setReader(connectedReader);
          readerRef.current = connectedReader;
          setStatus("ready");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to connect reader");
        setStatus("error");
      }
    },
    [discoverReaders, connectLocalMobileReader],
  );

  /**
   * Full charge flow: create intent → collect card → confirm.
   */
  const charge = useCallback(
    async (dto: CreateTerminalPaymentIntentRequest) => {
      if (!eventId) throw new Error("No event selected");

      try {
        setStatus("collecting");
        setError(null);

        // 1. Create payment intent on backend
        const { paymentIntentId } = await terminalApi.createPaymentIntent(
          eventId,
          dto,
        );

        // 2. Retrieve the payment intent in the SDK
        const { paymentIntent, error: retrieveError } =
          await retrievePaymentIntent(paymentIntentId);

        if (retrieveError || !paymentIntent) {
          throw new Error(
            retrieveError?.message || "Failed to retrieve payment intent",
          );
        }

        // 3. Collect payment method (shows native "Ready to Tap" NFC UI)
        const { paymentIntent: collected, error: collectError } =
          await collectPaymentMethod({ paymentIntent });

        if (collectError || !collected) {
          throw new Error(
            collectError?.message || "Payment collection cancelled",
          );
        }

        // 4. Confirm the payment
        setStatus("processing");
        const { paymentIntent: confirmed, error: confirmError } =
          await confirmPaymentIntent({ paymentIntent: collected });

        if (confirmError || !confirmed) {
          throw new Error(
            confirmError?.message || "Payment confirmation failed",
          );
        }

        setStatus("success");
        return confirmed;
      } catch (err: any) {
        setError(err?.message || "Payment failed");
        setStatus("error");
        throw err;
      }
    },
    [
      eventId,
      retrievePaymentIntent,
      collectPaymentMethod,
      confirmPaymentIntent,
    ],
  );

  /**
   * Reset status back to ready (after success/error).
   */
  const reset = useCallback(() => {
    setError(null);
    setStatus(readerRef.current ? "ready" : "idle");
  }, []);

  /**
   * Cancel reader discovery if in progress.
   */
  const cancel = useCallback(async () => {
    try {
      await cancelDiscovering();
    } catch {
      // ignore
    }
    setStatus("idle");
  }, [cancelDiscovering]);

  return {
    status,
    error,
    reader,
    connect,
    charge,
    reset,
    cancel,
  };
}
