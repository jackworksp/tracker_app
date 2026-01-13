package com.timeblock.app;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TimeboxNative")
public class TimeboxNativePlugin extends Plugin {

    @PluginMethod
    public void startOverlay(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            call.reject("Overlay permission not granted");
            android.widget.Toast.makeText(getContext(), "Overlay permission missing!", android.widget.Toast.LENGTH_LONG).show();
            return;
        }

        int duration = call.getInt("duration", 15);
        String goal = call.getString("goal", "Focus");

        android.util.Log.d("TimeboxNative", "Starting overlay with duration: " + duration);
        android.widget.Toast.makeText(getContext(), "Starting Overlay Service...", android.widget.Toast.LENGTH_SHORT).show();

        Intent intent = new Intent(getContext(), OverlayService.class);
        intent.putExtra("TIME_TEXT", duration + ":00");
        
        try {
            getContext().startService(intent);
            call.resolve();
        } catch (Exception e) {
            android.util.Log.e("TimeboxNative", "Failed to start service", e);
            call.reject("Failed to start service: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopOverlay(PluginCall call) {
        Intent intent = new Intent(getContext(), OverlayService.class);
        intent.setAction("STOP");
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("overlay", Settings.canDrawOverlays(getContext()));
        // Accessibility check is harder, usually involves checking enabled services string
        ret.put("accessibility", isAccessibilityServiceEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivityForResult(intent, 123);
        }
        
        // For accessibility, we just open settings
        if (!isAccessibilityServiceEnabled()) {
             Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
             getContext().startActivity(intent);
        }
        
        call.resolve();
    }

    private boolean isAccessibilityServiceEnabled() {
        String prefString = Settings.Secure.getString(getContext().getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return prefString != null && prefString.contains(getContext().getPackageName() + "/" + AppBlockerService.class.getName());
    }
}
