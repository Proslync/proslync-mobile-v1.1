// Expandable FAB menu with glass morphing animation
// Plus button morphs into 3 action buttons via GlassEffectContainer + Namespace

import {
  GlassEffectContainer,
  Host,
  Image,
  Namespace,
  Spacer,
  VStack,
} from "@expo/ui/swift-ui";
import {
  animation,
  Animation,
  frame,
  glassEffect,
  glassEffectId,
  onTapGesture,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import * as React from "react";

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
  const [expanded, setExpanded] = React.useState(false);
  const namespaceId = React.useId();

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpanded((prev) => !prev);
  };

  return (
    <Host
      style={{
        position: "absolute",
        bottom: 120,
        right: 16,
        width: 56,
        height: 260,
        justifyContent: "flex-end",
      }}
      colorScheme="dark"
    >
      <Namespace id={namespaceId}>
        <VStack
          spacing={0}
          modifiers={[
            frame({ maxHeight: 99999 }),
            animation(
              Animation.spring({
                response: 0.7,
                dampingFraction: 0.9,
                blendDuration: 0.5,
                bounce: 1,
              }),
              expanded,
            ),
          ]}
        >
          <Spacer />
          <GlassEffectContainer spacing={8}>
            <VStack spacing={8}>
              {expanded && (
                <>
                  <Image
                    systemName={isSharing ? "location.fill" : "location"}
                    size={20}
                    color={isSharing ? "#34c759" : "#fff"}
                    modifiers={[
                      frame({ width: 48, height: 48 }),
                      glassEffect({
                        glass: { variant: "clear" },
                        shape: "circle",
                      }),
                      glassEffectId("action-share", namespaceId),
                      onTapGesture(() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onShareLocation();
                        setExpanded(false);
                      }),
                    ]}
                  />

                  <Image
                    systemName="location.viewfinder"
                    size={20}
                    color="#fff"
                    modifiers={[
                      frame({ width: 48, height: 48 }),
                      glassEffect({
                        glass: { variant: "clear" },
                        shape: "circle",
                      }),
                      glassEffectId("action-recenter", namespaceId),
                      onTapGesture(() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onRecenter();
                        setExpanded(false);
                      }),
                    ]}
                  />

                  <Image
                    systemName="person.2.fill"
                    size={20}
                    color="#fff"
                    modifiers={[
                      frame({ width: 48, height: 48 }),
                      glassEffect({
                        glass: { variant: "clear" },
                        shape: "circle",
                      }),
                      glassEffectId("action-nearby", namespaceId),
                      onTapGesture(() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onNearby();
                        setExpanded(false);
                      }),
                    ]}
                  />
                </>
              )}

              <Image
                systemName={expanded ? "xmark" : "plus"}
                size={24}
                color="#fff"
                modifiers={[
                  frame({ width: 52, height: 52 }),
                  glassEffect({
                    glass: { variant: "clear" },
                    shape: "circle",
                  }),
                  glassEffectId("fab-main", namespaceId),
                  onTapGesture(toggle),
                ]}
              />
            </VStack>
          </GlassEffectContainer>
        </VStack>
      </Namespace>
    </Host>
  );
}
