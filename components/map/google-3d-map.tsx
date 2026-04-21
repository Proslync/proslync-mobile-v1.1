// Photorealistic 3D map backed by Google's Map Tiles API (gmp-map-3d web
// component) rendered inside a WebView. Exposes an imperative flyTo handle
// and emits stadium tap events back to the RN side.

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export type Stadium3D = {
  id: string;
  lat: number;
  lng: number;
  venue: string;
  title: string;
};

export type Google3DMapHandle = {
  flyTo: (lat: number, lng: number, range?: number) => void;
};

type Props = {
  stadiums: Stadium3D[];
  center: { lat: number; lng: number };
  tilt?: number;
  range?: number;
  onStadiumPress?: (id: string) => void;
};

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function buildHtml({
  stadiums,
  center,
  tilt,
  range,
  apiKey,
}: {
  stadiums: Stadium3D[];
  center: { lat: number; lng: number };
  tilt: number;
  range: number;
  apiKey: string;
}): string {
  const stadiumsJson = JSON.stringify(stadiums);
  const centerJson = JSON.stringify(center);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
      #map { width: 100vw; height: 100vh; }
      .err {
        color: #fff; font-family: -apple-system, system-ui, sans-serif; font-size: 14px;
        padding: 16px; line-height: 1.4;
      }
    </style>
    <script>
      window.gm_authFailure = function () {
        post({ type: 'error', message: 'gm_authFailure — key rejected. Enable Map Tiles API + Maps JavaScript API, enable billing, and (if using HTTP referrer restrictions) allow https://proslync.local/*.' });
      };
      window.addEventListener('error', function (ev) {
        post({ type: 'error', message: 'JS error: ' + (ev.message || String(ev)) });
      });
      window.addEventListener('unhandledrejection', function (ev) {
        post({ type: 'error', message: 'Promise rejection: ' + ((ev.reason && (ev.reason.message || ev.reason)) || 'unknown') });
      });
      const origConsoleError = console.error;
      console.error = function () {
        try { post({ type: 'console_error', message: Array.from(arguments).map(String).join(' ') }); } catch (e) {}
        origConsoleError.apply(console, arguments);
      };
    </script>
    <script src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&libraries=maps3d" async defer></script>
  </head>
  <body>
    <gmp-map-3d
      id="map"
      center="${center.lat}, ${center.lng}, 250"
      tilt="${tilt}"
      range="${range}"
      heading="0"
    ></gmp-map-3d>
    <script>
      const CENTER = ${centerJson};
      const STADIUMS = ${stadiumsJson};
      function post(payload) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function waitForLib() {
        return new Promise((resolve, reject) => {
          const start = Date.now();
          const tick = () => {
            if (window.google && window.google.maps && window.google.maps.importLibrary) {
              resolve();
            } else if (Date.now() - start > 15000) {
              reject(new Error('Google Maps JS failed to load (check API key + Maps JavaScript API enabled)'));
            } else {
              setTimeout(tick, 120);
            }
          };
          tick();
        });
      }

      async function init() {
        try {
          await waitForLib();
          const lib = await google.maps.importLibrary('maps3d');
          const MarkerCtor = lib.Marker3DInteractiveElement || lib.Marker3DElement;
          if (!MarkerCtor) throw new Error('Marker3DElement not available in maps3d library');

          await customElements.whenDefined('gmp-map-3d');
          const map = document.getElementById('map');

          STADIUMS.forEach((s) => {
            try {
              const marker = new MarkerCtor({
                position: { lat: s.lat, lng: s.lng, altitude: 80 },
                altitudeMode: 'RELATIVE_TO_GROUND',
                label: s.venue,
                extruded: true,
              });
              if (marker.addEventListener) {
                marker.addEventListener('gmp-click', () => post({ type: 'stadium_tap', id: s.id }));
              }
              map.append(marker);
            } catch (e) {
              post({ type: 'error', message: 'marker add failed: ' + (e.message || e) });
            }
          });

          post({ type: 'ready' });
        } catch (e) {
          post({ type: 'error', message: 'init failed: ' + (e && e.message ? e.message : e) });
        }
      }

      window.__flyTo = (lat, lng, range) => {
        const map = document.getElementById('map');
        if (!map || !map.flyCameraTo) return;
        map.flyCameraTo({
          endCamera: { center: { lat, lng, altitude: 80 }, tilt: 65, range: range || 1500 },
          durationMillis: 2500,
        });
      };

      if (document.readyState === 'complete') init();
      else window.addEventListener('load', init);
    </script>
  </body>
</html>`;
}

export const Google3DMap = forwardRef<Google3DMapHandle, Props>(function Google3DMap(
  { stadiums, center, tilt = 60, range = 3000, onStadiumPress },
  ref,
) {
  const webRef = useRef<WebView>(null);

  const html = useMemo(
    () =>
      buildHtml({
        stadiums,
        center,
        tilt,
        range,
        apiKey: API_KEY ?? "",
      }),
    [stadiums, center, tilt, range],
  );

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lat: number, lng: number, r?: number) => {
        const js = `window.__flyTo(${lat}, ${lng}, ${r ?? "null"}); true;`;
        webRef.current?.injectJavaScript(js);
      },
    }),
    [],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "stadium_tap" && typeof data.id === "string") {
          onStadiumPress?.(data.id);
        } else if (data.type === "error" || data.type === "console_error") {
          console.warn("[Google3DMap]", data.message);
        } else if (data.type === "ready") {
          console.log("[Google3DMap] ready");
        }
      } catch {}
    },
    [onStadiumPress],
  );

  if (!API_KEY) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Google 3D Maps — API key missing</Text>
        <Text style={styles.missingBody}>
          Set{" "}
          <Text style={styles.mono}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY</Text> in{" "}
          <Text style={styles.mono}>.env</Text> and restart Metro. Enable the{" "}
          <Text style={styles.mono}>Map Tiles API</Text> + Maps JavaScript API for the key.
        </Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      source={{ html, baseUrl: "https://proslync.local/" }}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode="always"
      onMessage={handleMessage}
      style={styles.web}
      scrollEnabled={false}
    />
  );
});

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: "#000" },
  missing: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  missingTitle: { color: "#FFF", fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  missingBody: { color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 20, textAlign: "center" },
  mono: { fontFamily: "Menlo", color: "#FF9A5E" },
});
