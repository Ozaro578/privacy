import type { CapacitorConfig } from "@capacitor/cli";

// ZUKKABRO App: lädt die Live-Seite zukkabro.de in einer nativen Hülle.
// Inhalte kommen immer aktuell von der Website, die App muss für Änderungen nicht neu gebaut werden.
const config: CapacitorConfig = {
  appId: "de.zukkabro.app",
  appName: "ZUKKABRO",
  webDir: "www",
  server: {
    url: "https://zukkabro.de/?quelle=app",
    allowNavigation: ["zukkabro.de", "*.zukkabro.de", "checkout.stripe.com", "*.stripe.com"],
  },
  // Damit die Website weiß, dass sie in der App läuft (Vapes werden dort ausgeblendet, App-Leiste an)
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
