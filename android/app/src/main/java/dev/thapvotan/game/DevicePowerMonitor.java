package dev.thapvotan.game;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.PowerManager;
import android.webkit.JavascriptInterface;
import org.json.JSONObject;

/** Anonymous rendering limits, queried locally without runtime permissions. */
public final class DevicePowerMonitor {
    private final Context context;
    private final PowerManager power;
    private final Runnable onChange;
    private final boolean lowRam;
    private final double memoryGB;
    private final ThermalWatch thermal;
    private boolean watching, receiverRegistered;
    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { signal(); }
    };

    DevicePowerMonitor(Context context, Runnable onChange) {
        this.context = context;
        this.onChange = onChange;
        power = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        boolean small = false;
        double memory = 0;
        if (manager != null) {
            try {
                small = manager.isLowRamDevice();
                ActivityManager.MemoryInfo info = new ActivityManager.MemoryInfo();
                manager.getMemoryInfo(info);
                memory = info.totalMem / (1024d * 1024d * 1024d);
            } catch (RuntimeException ignored) { }
        }
        lowRam = small;
        memoryGB = memory;
        thermal = Build.VERSION.SDK_INT >= 29 && power != null ? new ThermalWatch(power, this::signal) : null;
    }

    @JavascriptInterface public String profile() {
        JSONObject result = new JSONObject();
        try {
            result.put("lowRam", lowRam);
            if (memoryGB > 0) result.put("memoryGB", memoryGB);
            result.put("powerSave", power != null && power.isPowerSaveMode());
            result.put("thermal", thermal == null ? 0 : thermal.status());
        } catch (Exception ignored) { }
        return result.toString();
    }

    void start() {
        if (watching) return;
        watching = true;
        try {
            IntentFilter filter = new IntentFilter(PowerManager.ACTION_POWER_SAVE_MODE_CHANGED);
            if (Build.VERSION.SDK_INT >= 33) context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
            else context.registerReceiver(receiver, filter);
            receiverRegistered = true;
        } catch (RuntimeException ignored) { }
        if (thermal != null) thermal.start(context);
        signal();
    }

    void stop() {
        watching = false;
        if (receiverRegistered) {
            try { context.unregisterReceiver(receiver); } catch (RuntimeException ignored) { }
            receiverRegistered = false;
        }
        if (thermal != null) thermal.stop();
    }

    private void signal() { if (watching) onChange.run(); }

    // Keep Android 10 thermal APIs out of the Android 7-9 execution path.
    @android.annotation.TargetApi(29)
    private static final class ThermalWatch {
        private final PowerManager manager;
        private final PowerManager.OnThermalStatusChangedListener listener;
        private boolean registered;
        ThermalWatch(PowerManager manager, Runnable change) {
            this.manager = manager;
            listener = status -> change.run();
        }
        int status() {
            try { return manager.getCurrentThermalStatus(); } catch (RuntimeException ignored) { return 0; }
        }
        void start(Context context) {
            if (registered) return;
            try { manager.addThermalStatusListener(context.getMainExecutor(), listener); registered = true; }
            catch (RuntimeException ignored) { }
        }
        void stop() {
            if (!registered) return;
            try { manager.removeThermalStatusListener(listener); } catch (RuntimeException ignored) { }
            registered = false;
        }
    }
}
