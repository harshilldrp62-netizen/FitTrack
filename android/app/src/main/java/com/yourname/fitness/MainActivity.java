package com.yourname.fitness;

import static androidx.core.content.ContextCompat.startForegroundService;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    private static final int REQ_ACTIVITY_RECOGNITION = 9001;
    private static final int REQ_POST_NOTIFICATIONS = 9002;
    private static final String REMINDER_CHANNEL_ID = "fitness_reminders";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugin before BridgeActivity initialization.
        // If registered after super.onCreate, Capacitor may not expose it to JS.
        registerPlugin(StepPlugin.class);
        super.onCreate(savedInstanceState);
        setupReminderNotifications();
        Log.d(TAG, "onCreate: bridge activity created");
    }

    @Override
    public void onStart() {
        super.onStart();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            int granted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION);
            if (granted != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.ACTIVITY_RECOGNITION},
                    REQ_ACTIVITY_RECOGNITION
                );
                Log.w(TAG, "onStart: requesting ACTIVITY_RECOGNITION permission");
                return;
            }
        }

        startStepServiceIfNeeded();
    }

    private void startStepServiceIfNeeded() {
        new Handler(Looper.getMainLooper()).post(() -> {
            Intent serviceIntent = new Intent(this, StepService.class);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent);
                } else {
                    startService(serviceIntent);
                }
                Log.d(TAG, "onStart: StepService start/refresh requested");
            } catch (Exception e) {
                Log.e(TAG, "onStart: failed to start StepService", e);
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQ_ACTIVITY_RECOGNITION) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            Log.d(TAG, "onRequestPermissionsResult: ACTIVITY_RECOGNITION granted=" + granted);
            if (granted) {
                startStepServiceIfNeeded();
            }
            return;
        }

        if (requestCode == REQ_POST_NOTIFICATIONS) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            Log.d(TAG, "onRequestPermissionsResult: POST_NOTIFICATIONS granted=" + granted);
        }
    }

    private void setupReminderNotifications() {
        createReminderChannel();
        requestNotificationPermissionIfNeeded();
        ReminderScheduler.rescheduleFromPreferences(this);
    }

    private void createReminderChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel channel = new NotificationChannel(
            REMINDER_CHANNEL_ID,
            "Fitness Reminders",
            NotificationManager.IMPORTANCE_HIGH
        );
        manager.createNotificationChannel(channel);
        Log.d("ReminderDebug", "Reminder notification channel initialized");
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                REQ_POST_NOTIFICATIONS
            );
        }
    }
}
