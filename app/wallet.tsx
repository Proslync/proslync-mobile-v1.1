import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWallet } from "@/lib/providers/wallet-provider";

/**
 * Deep link handler for status://wallet
 * Redirects to the wallet tab and handles setup callbacks from Stripe onboarding.
 */
export default function WalletRedirect() {
  const router = useRouter();
  const { setup } = useLocalSearchParams<{ setup?: string }>();
  const { refreshWallet } = useWallet();

  useEffect(() => {
    // If returning from Stripe onboarding, refresh wallet data
    if (setup === "success" || setup === "refresh") {
      refreshWallet();
    }

    // Navigate to the wallet tab
    router.replace("/(tabs)/activity");
  }, [setup, router, refreshWallet]);

  return null;
}
