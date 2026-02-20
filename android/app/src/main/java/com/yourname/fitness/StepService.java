package com.yourname.fitness;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class StepService extends Service implements SensorEventListener {

    private static final String TAG = "StepService";
    private static final String CHANNEL_ID = "steps_channel";
    private static final int NOTIFICATION_ID = 1001;

    private static final String PREFS_NAME = "steps";
    private static final String KEY_LATEST_STEPS = "latest_steps";
    private static final String KEY_LATEST_SENSOR_TOTAL = "latest_sensor_total";
    private static final String KEY_BASELINE_SENSOR_TOTAL = "baseline_sensor_total";
    private static final String KEY_BASELINE_DAY = "baseline_day";

    private static volatile boolean serviceRunning = false;

    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private Sensor stepDetectorSensor;
    private boolean usingStepDetector = false;

    public static boolean isServiceRunning() {
        return serviceRunning;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        serviceRunning = true;
        Log.d(TAG, "onCreate: starting foreground step service");

        createNotificationChannel();
        startAsForegroundService();

        ensureStepListenerRegistered();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "onStartCommand: startId=" + startId + " flags=" + flags);
        ensureStepListenerRegistered();
        return START_STICKY;
    }

    private void ensureStepListenerRegistered() {
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager == null) {
            Log.e(TAG, "ensureStepListenerRegistered: SensorManager is null");
            return;
        }

        try {
            sensorManager.unregisterListener(this);
        } catch (Exception ignored) {
        }

        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        stepDetectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR);

        boolean registered = false;
        usingStepDetector = false;

        if (stepCounterSensor != null) {
            try {
                registered = sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_UI);
                Log.d(TAG, "ensureStepListenerRegistered: TYPE_STEP_COUNTER registered=" + registered);
            } catch (SecurityException se) {
                Log.e(TAG, "ensureStepListenerRegistered: ACTIVITY_RECOGNITION missing for STEP_COUNTER", se);
            }
        } else {
            Log.w(TAG, "ensureStepListenerRegistered: TYPE_STEP_COUNTER not available");
        }

        if (!registered && stepDetectorSensor != null) {
            try {
                registered = sensorManager.registerListener(this, stepDetectorSensor, SensorManager.SENSOR_DELAY_UI);
                usingStepDetector = registered;
                Log.d(TAG, "ensureStepListenerRegistered: TYPE_STEP_DETECTOR registered=" + registered);
            } catch (SecurityException se) {
                Log.e(TAG, "ensureStepListenerRegistered: ACTIVITY_RECOGNITION missing for STEP_DETECTOR", se);
            }
        } else if (!registered) {
            Log.w(TAG, "ensureStepListenerRegistered: TYPE_STEP_DETECTOR not available");
        }

        Log.d(TAG, "ensureStepListenerRegistered: activeMode=" + (usingStepDetector ? "STEP_DETECTOR" : "STEP_COUNTER"));
    }

    private void startAsForegroundService() {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Fitness Tracker Running")
            .setContentText("Steps are being tracked in background")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build();

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH);
            Log.d(TAG, "startAsForegroundService: started with HEALTH foreground type");
        } else {
            startForeground(NOTIFICATION_ID, notification);
            Log.d(TAG, "startAsForegroundService: started foreground service");
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Step Tracking",
                NotificationManager.IMPORTANCE_LOW
            );

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "createNotificationChannel: channel ready");
            } else {
                Log.e(TAG, "createNotificationChannel: NotificationManager is null");
            }
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event == null || event.sensor == null) {
            return;
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        int sensorType = event.sensor.getType();

        if (sensorType == Sensor.TYPE_STEP_COUNTER) {
            int sensorTotal = (int) Math.floor(event.values[0]);
            if (sensorTotal < 0) {
                Log.w(TAG, "onSensorChanged: negative sensor value ignored=" + sensorTotal);
                return;
            }

            String baselineDay = prefs.getString(KEY_BASELINE_DAY, "");
            int baselineTotal = prefs.getInt(KEY_BASELINE_SENSOR_TOTAL, -1);

            if (baselineTotal < 0 || !today.equals(baselineDay)) {
                baselineTotal = sensorTotal;
                baselineDay = today;
                Log.d(TAG, "onSensorChanged(counter): baseline initialized for " + today + " baselineTotal=" + baselineTotal);
            } else if (sensorTotal < baselineTotal) {
                baselineTotal = sensorTotal;
                Log.w(TAG, "onSensorChanged(counter): sensor total dropped, baseline adjusted to " + baselineTotal);
            }

            int todaySteps = Math.max(0, sensorTotal - baselineTotal);

            prefs.edit()
                .putInt(KEY_LATEST_SENSOR_TOTAL, sensorTotal)
                .putInt(KEY_BASELINE_SENSOR_TOTAL, baselineTotal)
                .putString(KEY_BASELINE_DAY, baselineDay)
                .putInt(KEY_LATEST_STEPS, todaySteps)
                .apply();

            Log.d(TAG, "onSensorChanged(counter): sensorTotal=" + sensorTotal + " baseline=" + baselineTotal + " todaySteps=" + todaySteps);
            return;
        }

        if (sensorType == Sensor.TYPE_STEP_DETECTOR) {
            String baselineDay = prefs.getString(KEY_BASELINE_DAY, "");
            int todaySteps = prefs.getInt(KEY_LATEST_STEPS, 0);

            if (!today.equals(baselineDay)) {
                todaySteps = 0;
                baselineDay = today;
                Log.d(TAG, "onSensorChanged(detector): day rollover, resetting today's steps");
            }

            int delta = Math.max(1, Math.round(event.values[0]));
            todaySteps = Math.max(0, todaySteps + delta);

            prefs.edit()
                .putString(KEY_BASELINE_DAY, baselineDay)
                .putInt(KEY_LATEST_STEPS, todaySteps)
                .apply();

            Log.d(TAG, "onSensorChanged(detector): delta=" + delta + " todaySteps=" + todaySteps);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        Log.d(TAG, "onAccuracyChanged: accuracy=" + accuracy);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
            Log.d(TAG, "onDestroy: sensor listener unregistered");
        }
        serviceRunning = false;
        Log.d(TAG, "onDestroy: step service stopped");
        super.onDestroy();
    }
}
