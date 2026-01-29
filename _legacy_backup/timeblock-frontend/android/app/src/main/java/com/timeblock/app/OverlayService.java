package com.timeblock.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

public class OverlayService extends Service {

    private WindowManager windowManager;
    private View overlayView;
    private TextView timerText;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        createOverlay();
    }

    private void createOverlay() {
        android.util.Log.d("OverlayService", "createOverlay called");
        
        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );

        layoutParams.gravity = Gravity.TOP | Gravity.END;
        layoutParams.x = 0;
        layoutParams.y = 100;

        TextView view = new TextView(this);
        view.setText("15:00");
        view.setTextSize(20f);
        view.setPadding(30, 30, 30, 30);
        view.setBackgroundColor(0xCC000000); // Semi-transparent black
        view.setTextColor(0xFFFFFFFF); // White

        overlayView = view;
        timerText = view;

        if (windowManager != null) {
            try {
                windowManager.addView(overlayView, layoutParams);
                android.util.Log.d("OverlayService", "View added to WindowManager");
                android.widget.Toast.makeText(this, "Overlay Created Check 1", android.widget.Toast.LENGTH_SHORT).show();
            } catch (SecurityException e) {
                // Permission might have been revoked or not granted
                android.util.Log.e("OverlayService", "Security Exception", e);
                e.printStackTrace();
                stopSelf();
            } catch (Exception e) {
                android.util.Log.e("OverlayService", "Error adding view", e);
                e.printStackTrace();
            }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "STOP".equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null) {
            String time = intent.getStringExtra("TIME_TEXT");
            if (time != null && timerText != null) {
                timerText.setText(time);
            }
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (overlayView != null && windowManager != null) {
            windowManager.removeView(overlayView);
        }
    }
}
