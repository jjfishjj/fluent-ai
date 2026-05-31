import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluentai.app',
  appName: 'Fluent AI',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#7C3AED',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#7C3AED',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
  },
};

export default config;
