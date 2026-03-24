// Reusable expandable FAB menu with native iOS glass morphing
// Supports vertical/horizontal layout and configurable expand direction

import {
  GlassEffectContainer,
  Host,
  HStack,
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
import type { ViewStyle } from "react-native";
import type { SFSymbol } from "sf-symbols-typescript";

// ─── Types ───

export interface FabAction {
  /** Unique ID for glass morphing */
  id: string;
  /** SF Symbol name */
  icon: SFSymbol;
  /** Icon color. Default: '#fff' */
  color?: string;
  /** Callback when tapped */
  onPress: () => void;
}

export interface GlassFabMenuProps {
  /** Action buttons that expand from the FAB */
  actions: FabAction[];
  /** SF Symbol for the main FAB button. Default: 'plus' */
  fabIcon?: SFSymbol;
  /** SF Symbol when expanded. Default: 'xmark' */
  fabIconExpanded?: SFSymbol;
  /** FAB icon color. Default: '#fff' */
  fabColor?: string;
  /** Layout direction of expanded actions */
  direction?: "up" | "down" | "left" | "right";
  /** Size of action buttons. Default: 48 */
  actionSize?: number;
  /** Size of main FAB button. Default: 52 */
  fabSize?: number;
  /** Spacing between buttons when expanded. Default: 8 */
  spacing?: number;
  /** Glass merge distance. Default: 8 */
  glassSpacing?: number;
  /** Glass variant. Default: 'clear' */
  glassVariant?: "clear" | "regular";
  /** Spring animation config */
  spring?: {
    response?: number;
    dampingFraction?: number;
    bounce?: number;
    blendDuration?: number;
  };
  /** Host color scheme. Default: 'dark' */
  colorScheme?: "dark" | "light";
  /** Close menu after action press. Default: true */
  closeOnAction?: boolean;
  /** Additional style for the Host container */
  style?: ViewStyle;
}

// ─── Defaults ───

const DEFAULTS = {
  fabIcon: "plus" as SFSymbol,
  fabIconExpanded: "xmark" as SFSymbol,
  fabColor: "#fff",
  direction: "up" as const,
  actionSize: 48,
  fabSize: 52,
  spacing: 8,
  glassSpacing: 8,
  glassVariant: "clear" as const,
  spring: {
    response: 0.6,
    dampingFraction: 0.9,
    blendDuration: 0.4,
    bounce: 1,
  },
  colorScheme: "dark" as const,
  closeOnAction: true,
};

// ─── Size calculation ───

function getHostSize(
  direction: string,
  actionSize: number,
  fabSize: number,
  spacing: number,
  actionCount: number,
) {
  const expandedLength = fabSize + actionCount * (actionSize + spacing) + 20;

  const isVertical = direction === "up" || direction === "down";
  return {
    width: isVertical ? fabSize + 4 : expandedLength,
    height: isVertical ? expandedLength : fabSize + 4,
  };
}

// ─── Component ───

export function GlassFabMenu({
  actions,
  fabIcon = DEFAULTS.fabIcon,
  fabIconExpanded = DEFAULTS.fabIconExpanded,
  fabColor = DEFAULTS.fabColor,
  direction = DEFAULTS.direction,
  actionSize = DEFAULTS.actionSize,
  fabSize = DEFAULTS.fabSize,
  spacing = DEFAULTS.spacing,
  glassSpacing = DEFAULTS.glassSpacing,
  glassVariant = DEFAULTS.glassVariant,
  spring = DEFAULTS.spring,
  colorScheme = DEFAULTS.colorScheme,
  closeOnAction = DEFAULTS.closeOnAction,
  style,
}: GlassFabMenuProps) {
  const [expanded, setExpanded] = React.useState(false);
  const namespaceId = React.useId();

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpanded((prev) => !prev);
  };

  const handleAction = (action: FabAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action.onPress();
    if (closeOnAction) setExpanded(false);
  };

  const isVertical = direction === "up" || direction === "down";
  const hostSize = getHostSize(
    direction,
    actionSize,
    fabSize,
    spacing,
    actions.length,
  );
  const Stack = isVertical ? VStack : HStack;

  // Build the spring animation
  const springAnim = Animation.spring({
    response: spring.response ?? DEFAULTS.spring.response,
    dampingFraction: spring.dampingFraction ?? DEFAULTS.spring.dampingFraction,
    bounce: spring.bounce ?? DEFAULTS.spring.bounce,
    blendDuration: spring.blendDuration ?? DEFAULTS.spring.blendDuration,
  });

  // Determine if spacer goes before or after content
  const spacerBefore = direction === "up" || direction === "left";

  // Render action buttons
  const actionButtons = expanded
    ? actions.map((action) => (
        <Image
          key={action.id}
          systemName={action.icon}
          size={actionSize * 0.42}
          color={action.color ?? "#fff"}
          modifiers={[
            frame({ width: actionSize, height: actionSize }),
            glassEffect({
              glass: { variant: glassVariant },
              shape: "circle",
            }),
            glassEffectId(`action-${action.id}`, namespaceId),
            onTapGesture(() => handleAction(action)),
          ]}
        />
      ))
    : null;

  // Main FAB button
  const fabButton = (
    <Image
      systemName={expanded ? fabIconExpanded : fabIcon}
      size={fabSize * 0.46}
      color={fabColor}
      modifiers={[
        frame({ width: fabSize, height: fabSize }),
        glassEffect({
          glass: { variant: glassVariant },
          shape: "circle",
        }),
        glassEffectId("fab-main", namespaceId),
        onTapGesture(toggle),
      ]}
    />
  );

  return (
    <Host
      style={{
        width: hostSize.width,
        height: hostSize.height,
        ...style,
      }}
      colorScheme={colorScheme}
    >
      <Namespace id={namespaceId}>
        <Stack
          spacing={0}
          modifiers={[
            frame({ maxWidth: 99999, maxHeight: 99999 }),
            animation(springAnim, expanded),
          ]}
        >
          {spacerBefore && <Spacer />}

          <GlassEffectContainer spacing={glassSpacing}>
            <Stack spacing={spacing}>
              {/* Actions before FAB (for up/left) or after (for down/right) */}
              {(direction === "up" || direction === "left") && actionButtons}
              {fabButton}
              {(direction === "down" || direction === "right") && actionButtons}
            </Stack>
          </GlassEffectContainer>

          {!spacerBefore && <Spacer />}
        </Stack>
      </Namespace>
    </Host>
  );
}
