import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Ensure camera & microphone permissions are granted when running in native wrappers.
 * Returns true if permissions are (or can be) granted, false if denied.
 */
export async function ensureAVPermissions(): Promise<boolean> {
  // On web, rely on navigator.mediaDevices.getUserMedia to prompt the user.
  if (Capacitor.getPlatform && Capacitor.getPlatform() === 'web') {
    return true;
  }

  // Running on native (Capacitor) — try to use Capacitor Permissions plugin
  try {
    // Try requesting camera
    try {
      await Camera.requestPermissions({ permissions: ['camera'] });

      if (!(await Camera.checkPermissions())) return false;
    } catch (e) {
      // Some Capacitor/Android flavors may not support string-requests; ignore and continue
      console.warn('Camera permission request failed (fallback will be used):', e);
    }

    return true;
  } catch (e) {
    // Permissions plugin not available — fallback to letting getUserMedia trigger prompts
    console.warn(
      'Capacitor Permissions plugin not available, falling back to navigator prompts',
      e
    );
    return true;
  }
}
