import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.fitness',
  appName: 'FitnessApp',
  webDir: 'dist',
  // Server config commented out for production builds
  // Uncomment for development to load from remote server
  // server:{
  //   url: 'https://fittrack-7efb7.web.app',
  //   cleartext: false
  // }
};

export default config;
