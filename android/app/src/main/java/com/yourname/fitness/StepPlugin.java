package com.yourname.fitness;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StepPlugin")
public class StepPlugin extends Plugin {

    private static final String TAG = "StepPlugin";
    private static final String PREFS_NAME = "steps";
    private static final String KEY_LATEST_STEPS = "latest_steps";

    private int readStoredSteps() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int steps = prefs.getInt(KEY_LATEST_STEPS, 0);
        return Math.max(0, steps);
    }

    @PluginMethod
    public void getSteps(PluginCall call) {
        try {
            // Keep service as the single sensor owner. getSteps only returns today's persisted value.
            if (!StepService.isServiceRunning()) {
                Intent serviceIntent = new Intent(getContext(), StepService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getContext().startForegroundService(serviceIntent);
                } else {
                    getContext().startService(serviceIntent);
                }
                Log.d(TAG, "getSteps: StepService start requested");
            }
        } catch (Exception e) {
            Log.w(TAG, "getSteps: unable to start StepService", e);
        }

        int steps = readStoredSteps();
        Log.d(TAG, "getSteps: returning steps=" + steps);

        JSObject ret = new JSObject();
        ret.put("steps", steps);
        call.resolve(ret);
    }
}
