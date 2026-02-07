# Status App — Project Rules

## Design Language
- UI palette: **liquid glass, white, and black only**
- No purple or other accent colors in the UI
- White is the secondary color
- Glass effects use blur, translucent white fills, and white borders
- **All buttons use the follow button style** — translucent glass (GlassButton `glass` variant): ~15% white fill, ~25% white border, white text, blur backdrop. No solid/opaque buttons (no `accent`, `danger`, or `frosted` variants).
- **All pages use a dark gradient background** — `<DarkGradientBg />` from `@/components/shared/dark-gradient-bg` as the first child in every page container. Subtle white glow at top fading to black. Base container stays `backgroundColor: '#000'`.
- Do NOT publish to TestFlight unless explicitly asked
