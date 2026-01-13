package com.timeblock.app;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;

public class AppBlockerService extends AccessibilityService {

    public static boolean isBlockingActive = false;
    public static String blockedPackage = null;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isBlockingActive || event == null) return;

        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            CharSequence packageNameSeq = event.getPackageName();
            if (packageNameSeq != null) {
                String packageName = packageNameSeq.toString();

                // Simple check: if we are supposed to be blocking (session active?) we might want to block everything EXCEPT our app.
                // Or if blockedPackage is set.
                // For MVP, if ANY session is active, we might force home if not in our app.
                // But let's stick to the variable logic.
                
                if (blockedPackage != null && blockedPackage.equals(packageName)) {
                     performGlobalAction(GLOBAL_ACTION_HOME);
                }
            }
        }
    }

    @Override
    public void onInterrupt() {
        // Required method
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
    }
}
