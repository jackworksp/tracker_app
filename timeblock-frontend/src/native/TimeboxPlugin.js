import { registerPlugin } from '@capacitor/core';

const TimeboxNative = registerPlugin('TimeboxNative', {
  web: {
    async startOverlay(options) {
      console.log('startOverlay', options);
      return { success: true };
    },
    async stopOverlay() {
      console.log('stopOverlay');
      return { success: true };
    },
    async checkPermissions() {
      return { overlay: true, accessibility: true };
    },
    async requestPermissions() {
      return { overlay: true, accessibility: true };
    }
  },
});

export default TimeboxNative;
