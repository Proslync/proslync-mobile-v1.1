// Ambient declarations for @expo-google-fonts/* packages that are loaded via
// dynamic import() in app/_layout.tsx but are not currently part of the
// dependency tree. These declarations only describe the named font-asset
// exports the app consumes; they do not change any runtime behavior (the
// dynamic imports remain wrapped in try/catch in app/_layout.tsx).

declare module '@expo-google-fonts/orbitron' {
  const Orbitron_700Bold: number;
  const Orbitron_900Black: number;
  export { Orbitron_700Bold, Orbitron_900Black };
}

declare module '@expo-google-fonts/montserrat' {
  const Montserrat_400Regular: number;
  const Montserrat_500Medium: number;
  const Montserrat_700Bold: number;
  export { Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold };
}

declare module '@expo-google-fonts/bangers' {
  const Bangers_400Regular: number;
  export { Bangers_400Regular };
}
