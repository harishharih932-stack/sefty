package com.womensafety.ai

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.LocationServices
import okhttp3.*
import java.util.concurrent.TimeUnit

/**
 * SOSForegroundService
 *
 * Runs entirely in the background (no UI needed) once triggered.
 * Responsible for: getting live location, sending the Telegram alert,
 * and repeating location updates every 45 seconds until stopped.
 *
 * Reads saved user config (Telegram token, chat ID, contacts) from
 * SharedPreferences, which the Capacitor/web layer writes to via the
 * bridge plugin (see SOSCapacitorPlugin.kt) so both the web UI and this
 * native service share the same settings.
 */
class SOSForegroundService : Service() {

    companion object {
        const val ACTION_TRIGGER_SOS = "com.womensafety.ai.ACTION_TRIGGER_SOS"
        const val ACTION_STOP_SOS = "com.womensafety.ai.ACTION_STOP_SOS"
        const val CHANNEL_ID = "sos_channel"
        const val NOTIF_ID = 1001
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .build()

    private var repeatHandler: android.os.Handler? = null
    private var isRunning = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_SOS -> {
                stopRepeating()
                stopForeground(true)
                stopSelf()
                return START_NOT_STICKY
            }
            else -> startSOS()
        }
        return START_STICKY
    }

    private fun startSOS() {
        createNotificationChannel()
        startForeground(NOTIF_ID, buildNotification())

        if (isRunning) return
        isRunning = true

        sendLocationAndAlert(isFirstAlert = true)
        scheduleRepeat()
    }

    private fun scheduleRepeat() {
        repeatHandler = android.os.Handler(mainLooper)
        repeatHandler?.postDelayed(object : Runnable {
            override fun run() {
                if (!isRunning) return
                sendLocationAndAlert(isFirstAlert = false)
                repeatHandler?.postDelayed(this, 45_000)
            }
        }, 45_000)
    }

    private fun stopRepeating() {
        isRunning = false
        repeatHandler?.removeCallbacksAndMessages(null)
    }

    private fun getPrefs(): SharedPreferences =
        getSharedPreferences("women_safety_prefs", Context.MODE_PRIVATE)

    private fun sendLocationAndAlert(isFirstAlert: Boolean) {
        val fusedClient = LocationServices.getFusedLocationProviderClient(this)
        try {
            fusedClient.lastLocation.addOnSuccessListener { location: Location? ->
                val lat = location?.latitude ?: 0.0
                val lng = location?.longitude ?: 0.0
                sendTelegramAlert(lat, lng, isFirstAlert)
            }
        } catch (e: SecurityException) {
            // Location permission not granted; still send an alert without coordinates
            sendTelegramAlert(null, null, isFirstAlert)
        }
    }

    private fun sendTelegramAlert(lat: Double?, lng: Double?, isFirstAlert: Boolean) {
        val prefs = getPrefs()
        val token = prefs.getString("telegram_token", null) ?: return
        val chatId = prefs.getString("telegram_chat_id", null) ?: return

        val mapsLink = if (lat != null && lng != null) {
            "https://maps.google.com/?q=$lat,$lng"
        } else {
            "Location unavailable"
        }

        val time = java.text.SimpleDateFormat("dd MMM yyyy, hh:mm a").format(java.util.Date())

        val message = if (isFirstAlert) {
            "🚨 EMERGENCY ALERT\n\nI may be in danger.\n\n📍 Location:\n$mapsLink\n\n🕒 Time:\n$time\n\nPlease contact me immediately."
        } else {
            "📍 Live location update\n$mapsLink\n🕒 $time"
        }

        val url = "https://api.telegram.org/bot$token/sendMessage"
        val formBody = FormBody.Builder()
            .add("chat_id", chatId)
            .add("text", message)
            .build()

        val request = Request.Builder().url(url).post(formBody).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: java.io.IOException) {
                // Fails silently; next 45s cycle will retry. Could log to a local
                // file for later sync if network is down (see network-loss handling).
            }
            override fun onResponse(call: Call, response: Response) {
                response.close()
            }
        })
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SOS Emergency",
                NotificationManager.IMPORTANCE_HIGH
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val stopIntent = Intent(this, SOSForegroundService::class.java).apply {
            action = ACTION_STOP_SOS
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SOS Active")
            .setContentText("Emergency alert sent. Sharing live location.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setOngoing(true)
            .addAction(0, "End Emergency", stopPendingIntent)
            .build()
    }

    override fun onDestroy() {
        stopRepeating()
        super.onDestroy()
    }
}
