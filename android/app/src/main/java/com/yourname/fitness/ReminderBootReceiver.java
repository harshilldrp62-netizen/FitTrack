package com.yourname.fitness;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class ReminderBootReceiver extends BroadcastReceiver {

    private static final String TAG = "ReminderDebug";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            Log.d(TAG, "Boot/package event received. Rescheduling reminders.");
            ReminderScheduler.rescheduleFromPreferences(context);
        }
    }
}
