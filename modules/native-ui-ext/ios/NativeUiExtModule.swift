import ExpoModulesCore
import ExpoUI
import SwiftUI

// preferredColorScheme — sets the color scheme for the entire presentation (including sheet background)
struct PreferredColorSchemeModifier: ViewModifier, Record {
  @Field var scheme: String = "dark"

  func body(content: Content) -> some View {
    content
      .preferredColorScheme(scheme == "dark" ? .dark : .light)
  }
}

// presentationBackground — sets the background material/color for sheet presentations
struct PresentationBackgroundModifier: ViewModifier, Record {
  @Field var material: String? = nil
  @Field var color: String? = nil

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 16.4, *) {
      if let material = material {
        switch material {
        case "ultraThinMaterial":
          content.presentationBackground(.ultraThinMaterial)
        case "thinMaterial":
          content.presentationBackground(.thinMaterial)
        case "regularMaterial":
          content.presentationBackground(.regularMaterial)
        case "thickMaterial":
          content.presentationBackground(.thickMaterial)
        case "ultraThickMaterial":
          content.presentationBackground(.ultraThickMaterial)
        default:
          content.presentationBackground(.regularMaterial)
        }
      } else if let color = color {
        content.presentationBackground(Color(hex: color) ?? .clear)
      } else {
        content
      }
    } else {
      content
    }
  }
}

// Helper: parse hex color
extension Color {
  init?(hex: String) {
    var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

    var rgb: UInt64 = 0
    guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

    let length = hexSanitized.count
    switch length {
    case 6:
      self.init(
        red: Double((rgb & 0xFF0000) >> 16) / 255.0,
        green: Double((rgb & 0x00FF00) >> 8) / 255.0,
        blue: Double(rgb & 0x0000FF) / 255.0
      )
    case 8:
      self.init(
        red: Double((rgb & 0xFF000000) >> 24) / 255.0,
        green: Double((rgb & 0x00FF0000) >> 16) / 255.0,
        blue: Double((rgb & 0x0000FF00) >> 8) / 255.0,
        opacity: Double(rgb & 0x000000FF) / 255.0
      )
    default:
      return nil
    }
  }
}

public class NativeUiExtModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeUiExt")

    OnCreate {
      ViewModifierRegistry.register("preferredColorScheme") { params, appContext, _ in
        return try PreferredColorSchemeModifier(from: params, appContext: appContext)
      }

      ViewModifierRegistry.register("presentationBackground") { params, appContext, _ in
        return try PresentationBackgroundModifier(from: params, appContext: appContext)
      }
    }

    OnDestroy {
      ViewModifierRegistry.unregister("preferredColorScheme")
      ViewModifierRegistry.unregister("presentationBackground")
    }
  }
}
