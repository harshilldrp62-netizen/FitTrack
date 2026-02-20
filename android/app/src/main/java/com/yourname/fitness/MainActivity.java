package com.yourname.fitness;

import static androidx.core.content.ContextCompat.startForegroundService;

import android.Manifest;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugin before BridgeActivity initialization.
        // If registered after super.onCreate, Capacitor may not expose it to JS.
        registerPlugin(StepPlugin.class);
        super.onCreate(savedInstanceState);
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
        }
    }
}
