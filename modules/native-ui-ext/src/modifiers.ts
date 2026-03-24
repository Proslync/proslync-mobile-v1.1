import { createModifier } from "@expo/ui/swift-ui/modifiers";

/**
 * Sets the preferred color scheme for the entire presentation — affects sheet background, not just content.
 * This is the SwiftUI `.preferredColorScheme()` modifier.
 */
export const preferredColorScheme = (scheme: "light" | "dark") =>
  createModifier("preferredColorScheme", { scheme });

/**
 * Sets the background of a sheet presentation.
 * Use `material` for system blur materials, or `color` for a solid color.
 * Requires iOS 16.4+.
 */
export const presentationBackground = (
  params:
    | {
        material:
          | "ultraThinMaterial"
          | "thinMaterial"
          | "regularMaterial"
          | "thickMaterial"
          | "ultraThickMaterial";
      }
    | { color: string },
) => createModifier("presentationBackground", params);
