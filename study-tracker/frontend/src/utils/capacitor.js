/**
 * Capacitor Native Plugin Utilities for TaskTracker
 * 
 * SAFE VERSION - Does NOT auto-register push notifications
 * Push notifications require Firebase setup (google-services.json)
 */

// Lazy-loaded modules
let Capacitor = null;
let Camera = null;
let CameraResultType = null;
let CameraSource = null;
let Filesystem = null;
let Directory = null;
let SplashScreen = null;
let StatusBar = null;
let Style = null;

// Initialize core Capacitor
const initCore = async () => {
  if (Capacitor) return true;
  
  try {
    const core = await import('@capacitor/core');
    Capacitor = core.Capacitor;
    return true;
  } catch (e) {
    console.warn('Capacitor core not available:', e.message);
    return false;
  }
};

/**
 * Check if running on a native platform (Android/iOS)
 */
export const isNativePlatform = () => {
  try {
    return Capacitor?.isNativePlatform() || false;
  } catch {
    return false;
  }
};

/**
 * Get the current platform
 * @returns 'android' | 'ios' | 'web'
 */
export const getPlatform = () => {
  try {
    return Capacitor?.getPlatform() || 'web';
  } catch {
    return 'web';
  }
};

// ===========================================
// CAMERA (Lazy loaded)
// ===========================================

const ensureCamera = async () => {
  if (Camera) return true;
  
  try {
    const camera = await import('@capacitor/camera');
    Camera = camera.Camera;
    CameraResultType = camera.CameraResultType;
    CameraSource = camera.CameraSource;
    return true;
  } catch (e) {
    console.warn('Camera plugin not available:', e.message);
    return false;
  }
};

/**
 * Take a photo using the camera
 */
export const takePhoto = async (options = {}) => {
  if (!(await ensureCamera())) {
    return { success: false, error: 'Camera not available' };
  }
  
  try {
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType?.Base64 || 'base64',
      source: CameraSource?.Camera || 'CAMERA',
      width: options.width,
      height: options.height,
    });

    return {
      success: true,
      data: image.base64String || image.webPath,
      format: image.format,
    };
  } catch (error) {
    console.error('Camera error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Pick an image from the gallery
 */
export const pickImage = async (options = {}) => {
  if (!(await ensureCamera())) {
    return { success: false, error: 'Camera not available' };
  }
  
  try {
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType?.Base64 || 'base64',
      source: CameraSource?.Photos || 'PHOTOS',
    });

    return {
      success: true,
      data: image.base64String || image.webPath,
      format: image.format,
    };
  } catch (error) {
    console.error('Gallery error:', error);
    return { success: false, error: error.message };
  }
};

// ===========================================
// FILE SYSTEM (Lazy loaded)
// ===========================================

const ensureFilesystem = async () => {
  if (Filesystem) return true;
  
  try {
    const fs = await import('@capacitor/filesystem');
    Filesystem = fs.Filesystem;
    Directory = fs.Directory;
    return true;
  } catch (e) {
    console.warn('Filesystem plugin not available:', e.message);
    return false;
  }
};

/**
 * Write a file to the device
 */
export const writeFile = async (filename, data, directory = null) => {
  if (!(await ensureFilesystem())) {
    return { success: false, error: 'Filesystem not available' };
  }
  
  try {
    const result = await Filesystem.writeFile({
      path: filename,
      data: data,
      directory: directory || Directory?.Documents || 'DOCUMENTS',
    });

    return { success: true, uri: result.uri };
  } catch (error) {
    console.error('Write file error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Read a file from the device
 */
export const readFile = async (filename, directory = null) => {
  if (!(await ensureFilesystem())) {
    return { success: false, error: 'Filesystem not available' };
  }
  
  try {
    const result = await Filesystem.readFile({
      path: filename,
      directory: directory || Directory?.Documents || 'DOCUMENTS',
    });

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Read file error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a file from the device
 */
export const deleteFile = async (filename, directory = null) => {
  if (!(await ensureFilesystem())) {
    return { success: false, error: 'Filesystem not available' };
  }
  
  try {
    await Filesystem.deleteFile({
      path: filename,
      directory: directory || Directory?.Documents || 'DOCUMENTS',
    });

    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * List files in a directory
 */
export const listFiles = async (path = '', directory = null) => {
  if (!(await ensureFilesystem())) {
    return { success: false, error: 'Filesystem not available' };
  }
  
  try {
    const result = await Filesystem.readdir({
      path: path,
      directory: directory || Directory?.Documents || 'DOCUMENTS',
    });

    return { success: true, files: result.files };
  } catch (error) {
    console.error('List files error:', error);
    return { success: false, error: error.message };
  }
};

// ===========================================
// SPLASH SCREEN & STATUS BAR (Lazy loaded)
// ===========================================

const ensureSplashScreen = async () => {
  if (SplashScreen) return true;
  
  try {
    const splash = await import('@capacitor/splash-screen');
    SplashScreen = splash.SplashScreen;
    return true;
  } catch (e) {
    console.warn('Splash screen plugin not available:', e.message);
    return false;
  }
};

const ensureStatusBar = async () => {
  if (StatusBar) return true;
  
  try {
    const statusBar = await import('@capacitor/status-bar');
    StatusBar = statusBar.StatusBar;
    Style = statusBar.Style;
    return true;
  } catch (e) {
    console.warn('Status bar plugin not available:', e.message);
    return false;
  }
};

/**
 * Hide the splash screen
 */
export const hideSplashScreen = async () => {
  if (!isNativePlatform()) return;
  if (!(await ensureSplashScreen())) return;
  
  try {
    await SplashScreen.hide();
  } catch (error) {
    console.error('Hide splash screen error:', error);
  }
};

/**
 * Set status bar style
 */
export const setStatusBarStyle = async (dark = true) => {
  if (!isNativePlatform()) return;
  if (!(await ensureStatusBar())) return;
  
  try {
    await StatusBar.setStyle({
      style: dark ? (Style?.Dark || 'DARK') : (Style?.Light || 'LIGHT'),
    });
  } catch (error) {
    console.error('Set status bar style error:', error);
  }
};

/**
 * Set status bar background color
 */
export const setStatusBarColor = async (color = '#1a1a2e') => {
  if (!isNativePlatform()) return;
  if (!(await ensureStatusBar())) return;
  
  try {
    await StatusBar.setBackgroundColor({ color });
  } catch (error) {
    console.error('Set status bar color error:', error);
  }
};

// ===========================================
// PUSH NOTIFICATIONS - DISABLED BY DEFAULT
// Requires Firebase google-services.json setup
// ===========================================

/**
 * Initialize push notifications
 * NOTE: This requires Firebase to be configured!
 * Add google-services.json to android/app/ first
 */
export const initPushNotifications = async () => {
  console.log('Push notifications disabled - requires Firebase setup');
  console.log('To enable: Add google-services.json to android/app/');
  return false;
};

/**
 * Get the stored push token
 */
export const getPushToken = () => {
  return localStorage.getItem('pushToken');
};

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize Capacitor features (SAFE - no push notifications)
 * Call this in your App.jsx on mount
 */
export const initCapacitor = async () => {
  try {
    // Initialize core
    await initCore();
    
    if (!isNativePlatform()) {
      console.log('Running on web - Capacitor features limited');
      return;
    }

    console.log(`Running on ${getPlatform()}`);

    // Set up status bar (safe operations only)
    await setStatusBarStyle(true);
    await setStatusBarColor('#1a1a2e');

    // Hide splash after app is ready
    setTimeout(async () => {
      await hideSplashScreen();
    }, 500);
    
    console.log('Capacitor initialized successfully (without push notifications)');
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
};

export default {
  isNativePlatform,
  getPlatform,
  initPushNotifications,
  getPushToken,
  takePhoto,
  pickImage,
  writeFile,
  readFile,
  deleteFile,
  listFiles,
  hideSplashScreen,
  setStatusBarStyle,
  setStatusBarColor,
  initCapacitor,
};
