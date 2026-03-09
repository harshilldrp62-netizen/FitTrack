package com.yourname.fitness;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

public class ReminderAlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "ReminderDebug";
    private static final String CHANNEL_ID = "fitness_reminders";
    private static final String EXTRA_NOTIFICATION_ID = "extra_notification_id";
    private static final String EXTRA_TITLE = "extra_title";
    private static final String EXTRA_MESSAGE = "extra_message";
    private static final String EXTRA_HOUR = "extra_hour";
    private static final String EXTRA_MINUTE = "extra_minute";
    private static final String EXTRA_REQUEST_CODE = "extra_request_code";

    @Override
    public void onReceive(Context context, Intent intent) {
        int notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 4001);
        String title = intent.getStringExtra(EXTRA_TITLE);
        String message = intent.getStringExtra(EXTRA_MESSAGE);
        int hour = intent.getIntExtra(EXTRA_HOUR, 8);
        int minute = intent.getIntExtra(EXTRA_MINUTE, 0);
        int requestCode = intent.getIntExtra(EXTRA_REQUEST_CODE, notificationId);

        if (title == null || title.isEmpty()) title = "Reminder";
        if (message == null || message.isEmpty()) {
            message = "Don't forget your scheduled activity.";
        }

        Log.d(TAG, "Reminder triggered");

        ReminderScheduler.scheduleExactReminder(
            context,
            requestCode,
            notificationId,
            title,
            message,
            hour,
            minute
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            int permission = ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS);
            if (permission != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "POST_NOTIFICATIONS not granted, skipping notification delivery.");
                return;
            }
        }

        ensureChannel(context);

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            notificationId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(contentIntent);

        NotificationManagerCompat.from(context).notify(notificationId, builder.build());
    }

    private void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Fitness Reminders",
            NotificationManager.IMPORTANCE_HIGH
        );
        manager.createNotificationChannel(channel);
    }
}
