import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

function subscribe(onChange: () => void) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', onChange);
  viewport?.addEventListener('scroll', onChange);
  window.addEventListener('resize', onChange);
  return () => {
    viewport?.removeEventListener('resize', onChange);
    viewport?.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

function getInset() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return 0;
  return Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
}

/** Mobile Safari can display its keyboard without resizing the layout viewport. */
export function useWebKeyboardInset() {
  return useSyncExternalStore(subscribe, getInset, () => 0);
}
