import type { CapacitorConfig } from "@capacitor/cli";

// ZUKKABRO App: lädt die App-Ausgabe der Website (zukkabro.netlify.app, später app.zukkabro.de) in einer nativen Hülle.
// Diese Ausgabe ist eine eigene, bereinigte Kopie der Seite ohne Artikel mit Altersbeschränkung (Vorgabe der App-Stores).
// Inhalte kommen immer aktuell vom Server, die App muss für Änderungen nicht neu gebaut werden.
const config: CapacitorConfig = {
  appId: "de.zukkabro.app",
  appName: "ZUKKABRO",
  webDir: "www",
  server: {
    url: "https://zukkabro.netlify.app/?quelle=app",
    allowNavigation: ["zukkabro.netlify.app", "app.zukkabro.de"],
  },
  // Damit die Website weiß, dass sie in der App läuft (App-Leiste an, Bestellung öffnet im Browser)
  appendUserAgent: "ZukkabroApp/1.0",
  backgroundColor: "#fbf1e6",
  ios: { contentInset: "automatic", scheme: "ZUKKABRO", limitsNavigationsToAppBoundDomains: false },
  android: { allowMixedContent: false, backgroundColor: "#fbf1e6" },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, launchAutoHide: true, backgroundColor: "#fbf1e6", showSpinner: false, androidScaleType: "CENTER_CROP", splashImmersive: false },
    StatusBar: { style: "LIGHT", backgroundColor: "#fbf1e6", overlaysWebView: false },
  },
};

export default config;
