import { Platform } from 'react-native';

const DEV_HOST = __DEV__
  // use your machine’s LAN IP here
  ? 'http://192.168.1.107:8080'
  : 'https://your.production.url';

export const API_BASE = `${DEV_HOST}/api`;