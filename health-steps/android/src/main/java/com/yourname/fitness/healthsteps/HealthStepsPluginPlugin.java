package com.yourname.fitness.healthsteps;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "HealthStepsPlugin")
public class HealthStepsPluginPlugin extends Plugin implements SensorEventListener {

    private static final String TAG = "HealthStepsPlugin";
    private static final String PREFS = "health_steps_prefs";
    private static final String KEY_BASE = "step_base_value";
    private static final String KEY_DAY = "step_base_day";
    private static final int ACTIVITY_PERMISSION_REQUEST_CODE = 101;

    private HealthStepsPlugin implementation = new HealthStepsPlugin();
    private SensorManager sensorManager;
    private Sensor stepSensor;
    private boolean sensorRegistered = false;
    private long baseSteps = -1L;
    private String baseDay = "";
    private SharedPreferences prefs;

    @Override
    public void load() {
        super.load();

        Context context = getContext();
        prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        baseSteps = prefs.getLong(KEY_BASE, -1L);
        baseDay = prefs.getString(KEY_DAY, "");

        sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        }

        requestActivityPermissionIfNeeded();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        registerStepListener();
    }

    @Override
    protected void handleOnPause() {
        unregisterStepListener();
        super.handleOnPause();
    }

    @Override
    protected void handleRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.handleRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == ACTIVITY_PERMISSION_REQUEST_CODE && hasActivityRecognitionPermission()) {
            registerStepListener();
        }
    }

    @PluginMethod
    public void echo(PluginCall call) {
        String value = call.getString("value");

        JSObject ret = new JSObject();
        ret.put("value", implementation.echo(value));
        call.resolve(ret);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event == null || event.sensor == null || event.sensor.getType() != Sensor.TYPE_STEP_COUNTER) {
            return;
        }

        long totalSteps = (long) event.values[0];
        String today = getTodayKey();

        // Reset daily baseline on first reading of the day (or if sensor reset happened).
        if (!today.equals(baseDay) || baseSteps < 0L || totalSteps < baseSteps) {
            baseDay = today;
            baseSteps = totalSteps;
            persistBase();
        }

        int dailySteps = (int) Math.max(0L, totalSteps - baseSteps);
        emitStepUpdate(dailySteps);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // No-op
    }

    public void emitStepUpdate(int steps) {
        JSObject payload = new JSObject();
        payload.put("steps", steps);

        // Capacitor plugin event stream (required).
        notifyListeners("stepUpdate", payload, true);

        // Also dispatch a DOM event for existing window event listeners.
        if (bridge != null) {
            bridge.triggerJSEvent("stepUpdate", "window", String.valueOf(steps));
        }
    }

    private void registerStepListener() {
        if (sensorRegistered) {
            return;
        }

        if (sensorManager == null || stepSensor == null) {
            Logger.warn(TAG, "TYPE_STEP_COUNTER sensor unavailable on this device");
            return;
        }

        if (!hasActivityRecognitionPermission()) {
            requestActivityPermissionIfNeeded();
            return;
        }

        sensorRegistered = sensorManager.registerListener(
            this,
            stepSensor,
            SensorManager.SENSOR_DELAY_NORMAL
        );

        Logger.debug(TAG, sensorRegistered ? "Step sensor listener registered" : "Failed to register step listener");
    }

    private void unregisterStepListener() {
        if (!sensorRegistered || sensorManager == null) {
            return;
        }

        sensorManager.unregisterListener(this);
        sensorRegistered = false;
        Logger.debug(TAG, "Step sensor listener unregistered");
    }

    private boolean hasActivityRecognitionPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return true;
        }
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestActivityPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && getActivity() != null && !hasActivityRecognitionPermission()) {
                ActivityCompat.requestPermissions(
                getActivity(),
                new String[]{Manifest.permission.ACTIVITY_RECOGNITION},
                ACTIVITY_PERMISSION_REQUEST_CODE
            );
        }
    }

    private void persistBase() {
        if (prefs == null) {
            return;
        }
        prefs.edit()
            .putLong(KEY_BASE, baseSteps)
            .putString(KEY_DAY, baseDay)
            .apply();
    }

    private String getTodayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }
}
