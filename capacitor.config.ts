import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d43bea34478245bd90897a09a7edc859',
  appName: 'sirou-guardian-factory',
  webDir: 'dist',
  server: {
    url: 'https://d43bea34-4782-45bd-9089-7a09a7edc859.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
  },
};

export default config;
