// Map screen FAB — uses reusable GlassFabMenu with glass morphing

import * as React from "react";
import { GlassFabMenu, type FabAction } from "@/components/ui/glass-fab-menu";

interface MapFabMenuProps {
  onShareLocation: () => void;
  onRecenter: () => void;
  onNearby: () => void;
  isSharing?: boolean;
}

export function MapFabMenu({
  onShareLocation,
  onRecenter,
  onNearby,
  isSharing = false,
}: MapFabMenuProps) {
  const actions: FabAction[] = React.useMemo(
    () => [
      {
        id: "share",
        icon: isSharing ? "location.fill" : "location",
        color: isSharing ? "#34c759" : "#fff",
        onPress: onShareLocation,
      },
      {
        id: "recenter",
        icon: "location.viewfinder",
        onPress: onRecenter,
      },
      {
        id: "nearby",
        icon: "person.2.fill",
        onPress: onNearby,
      },
    ],
    [isSharing, onShareLocation, onRecenter, onNearby],
  );

  return (
    <GlassFabMenu
      actions={actions}
      direction="up"
      style={{
        position: "absolute",
        bottom: 120,
        right: 16,
      }}
    />
  );
}
