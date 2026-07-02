import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

async function initCapacitor() {
  if (Capacitor.isNativePlatform()) {
    await StatusBar.setStyle({ style: Style.Dark });
    await SplashScreen.hide();
  }
}

initCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
