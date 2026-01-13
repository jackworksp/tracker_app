package com.timeblock.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(TimeboxNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
