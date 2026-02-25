// Stripe Terminal Provider for Tap to Pay
import React, { type ReactElement } from "react";
import { StripeTerminalProvider } from "@stripe/stripe-terminal-react-native";
import { terminalApi } from "@/lib/api/terminal";

interface TerminalProviderProps {
  children: ReactElement | ReactElement[];
}

/**
 * Wraps children with StripeTerminalProvider.
 * Only mount this on the Tap to Pay screen — the SDK initializes on mount.
 */
export function TerminalProvider({ children }: TerminalProviderProps) {
  const fetchTokenProvider = async (): Promise<string> => {
    const res = await terminalApi.createConnectionToken();
    return res.secret;
  };

  return (
    <StripeTerminalProvider tokenProvider={fetchTokenProvider}>
      {children}
    </StripeTerminalProvider>
  );
}
