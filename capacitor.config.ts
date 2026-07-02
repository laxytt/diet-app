import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.laxytt.nouria',
  appName: 'Nouria',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    hostname: 'nouria.local',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#f4f6f1',
      showSpinner: false
    },
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
