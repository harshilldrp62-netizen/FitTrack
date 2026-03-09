package com.yourname.fitness;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

public final class ReminderScheduler {

    private static final String TAG = "ReminderDebug";
    private static final String PREFS_NAME = "fitness_reminders";
    private static final String KEY_NOTIFICATIONS_ENABLED = "notifications_enabled";
    private static final String KEY_MEAL_REMINDERS = "meal_reminders";
    private static final String KEY_WORKOUT_REMINDER = "workout_reminder";

    private static final String EXTRA_NOTIFICATION_ID = "extra_notification_id";
    private static final String EXTRA_TITLE = "extra_title";
    private static final String EXTRA_MESSAGE = "extra_message";
    private static final String EXTRA_HOUR = "extra_hour";
    private static final String EXTRA_MINUTE = "extra_minute";
    private static final String EXTRA_REQUEST_CODE = "extra_request_code";

    private ReminderScheduler() {
    }

    public static void saveReminderState(
        Context context,
        boolean notificationsEnabled,
        JSONArray reminders,
        JSONObject workoutReminder
    ) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putBoolean(KEY_NOTIFICATIONS_ENABLED, notificationsEnabled)
            .putString(KEY_MEAL_REMINDERS, reminders == null ? "[]" : reminders.toString())
            .putString(KEY_WORKOUT_REMINDER, workoutReminder == null ? "{}" : workoutReminder.toString())
            .apply();
    }

    public static void rescheduleFromPreferences(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean notificationsEnabled = prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, true);
        clearAllScheduledReminders(context);

        if (!notificationsEnabled) {
            Log.d(TAG, "Notifications disabled. Skipping reminder scheduling.");
            return;
        }

        try {
            String mealRemindersRaw = prefs.getString(KEY_MEAL_REMINDERS, "[]");
            JSONArray meals = new JSONArray(mealRemindersRaw == null ? "[]" : mealRemindersRaw);
            for (int i = 0; i < meals.length(); i++) {
                JSONObject item = meals.optJSONObject(i);
                if (item == null || !item.optBoolean("enabled", false)) continue;

                String id = item.optString("id", "");
                String time = item.optString("time", "");
                TimeParts parts = parseTime(time);
                if (parts == null) continue;

                if ("breakfast".equals(id)) {
                    scheduleExactReminder(
                        context,
                        2001,
                        2001,
                        "Time to log your meal",
                        "Don't forget to log your food.",
                        parts.hour,
                        parts.minute
                    );
                } else if ("lunch".equals(id)) {
                    scheduleExactReminder(
                        context,
                        2002,
                        2002,
                        "Time to log your meal",
                        "Don't forget to log your food.",
                        parts.hour,
                        parts.minute
                    );
                } else if ("dinner".equals(id)) {
                    scheduleExactReminder(
                        context,
                        2003,
                        2003,
                        "Time to log your meal",
                        "Don't forget to log your food.",
                        parts.hour,
                        parts.minute
                    );
                }
            }

            String workoutRaw = prefs.getString(KEY_WORKOUT_REMINDER, "{}");
            JSONObject workout = new JSONObject(workoutRaw == null ? "{}" : workoutRaw);
            if (workout.optBoolean("enabled", false)) {
                TimeParts parts = parseTime(workout.optString("time", ""));
                if (parts != null) {
                    scheduleExactReminder(
                        context,
                        2100,
                        2100,
                        "Workout reminder",
                        "It's time for your scheduled workout.",
                        parts.hour,
                        parts.minute
                    );
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to reschedule reminders from preferences", e);
        }
    }

    public static void clearAllScheduledReminders(Context context) {
        cancelReminder(context, 2001);
        cancelReminder(context, 2002);
        cancelReminder(context, 2003);
        cancelReminder(context, 2100);
    }

    public static void scheduleExactReminder(
        Context context,
        int requestCode,
        int notificationId,
        String title,
        String message,
        int hour,
        int minute
    ) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            Log.e(TAG, "AlarmManager unavailable. requestCode=" + requestCode);
            return;
        }

        Intent intent = new Intent(context, ReminderAlarmReceiver.class);
        intent.putExtra(EXTRA_NOTIFICATION_ID, notificationId);
        intent.putExtra(EXTRA_TITLE, title);
        intent.putExtra(EXTRA_MESSAGE, message);
        intent.putExtra(EXTRA_HOUR, hour);
        intent.putExtra(EXTRA_MINUTE, minute);
        intent.putExtra(EXTRA_REQUEST_CODE, requestCode);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long reminderTime = nextTriggerMillis(hour, minute);
        Log.d(TAG, "Reminder scheduled for: " + reminderTime + " requestCode=" + requestCode);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S
            && !alarmManager.canScheduleExactAlarms()) {
            Log.w(TAG, "Exact alarm permission unavailable; falling back to inexact while-idle scheduling.");
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, reminderTime, pendingIntent);
        } else if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, reminderTime, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, reminderTime, pendingIntent);
        }
    }

    private static void cancelReminder(Context context, int requestCode) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, ReminderAlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.cancel(pendingIntent);
    }

    private static long nextTriggerMillis(int hour, int minute) {
        Calendar now = Calendar.getInstance();
        Calendar next = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, hour);
        next.set(Calendar.MINUTE, minute);
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        if (!next.after(now)) {
            next.add(Calendar.DAY_OF_YEAR, 1);
        }
        return next.getTimeInMillis();
    }

    private static TimeParts parseTime(String value) {
        if (value == null || !value.contains(":")) return null;
        try {
            String[] parts = value.split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
            return new TimeParts(hour, minute);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static final class TimeParts {
        final int hour;
        final int minute;

        TimeParts(int hour, int minute) {
            this.hour = hour;
            this.minute = minute;
        }
    }
}
