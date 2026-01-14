import { Libraries } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let isLoaded = false;
let isLoading = false;
let loadPromise: Promise<boolean> | null = null;

interface GoogleMapsLoaderOptions {
  googleMapsApiKey: string;
  version?: string;
  libraries?: Libraries;
  language?: string;
  region?: string;
}

export const loadGoogleMaps = async (options?: Partial<GoogleMapsLoaderOptions>) => {
  if (isLoaded) {
    return true;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  const defaultOptions: GoogleMapsLoaderOptions = {
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['maps', 'drawing'],
    language: 'en',
    region: 'US',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  loadPromise = new Promise<boolean>(async (resolve) => {
    try {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mergedOptions.googleMapsApiKey}&v=${mergedOptions.version}&libraries=${mergedOptions.libraries?.join(',')}&language=${mergedOptions.language}&region=${mergedOptions.region}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isLoaded = true;
        isLoading = false;
        resolve(true);
      };
      script.onerror = () => {
        isLoading = false;
        resolve(false);
      };
      document.head.appendChild(script);
    } catch (error) {
      isLoading = false;
      resolve(false);
    }
  });

  return loadPromise;
};