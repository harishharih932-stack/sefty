package com.womensafety.ai

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * SOSCapacitorPlugin
 *
 * This is the bridge between the Lovable/React web layer and the native
 * Kotlin background logic. The web app (Settings screen, onboarding form)
 * calls these JS methods via Capacitor, e.g.:
 *
 *   import { registerPlugin } from '@capacitor/core';
 *   const SOSPlugin = registerPlugin('SOSPlugin');
 *
 *   await SOSPlugin.saveConfig({ telegramToken, telegramChatId });
 *   await SOSPlugin.isAccessibilityEnabled();
 *   await SOSPlugin.openAccessibilitySettings();
 */
@CapacitorPlugin(name = "SOSPlugin")
class SOSCapacitorPlugin : Plugin() {

    @PluginMethod
    fun saveConfig(call: PluginCall) {
        val prefs = context.getSharedPreferences("women_safety_prefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()

        call.getString("telegramToken")?.let { editor.putString("telegram_token", it) }
        call.getString("telegramChatId")?.let { editor.putString("telegram_chat_id", it) }
        call.getString("contact1")?.let { editor.putString("contact1", it) }
        call.getString("contact2")?.let { editor.putString("contact2", it) }
        call.getString("contact3")?.let { editor.putString("contact3", it) }

        editor.apply()
        call.resolve()
    }

    @PluginMethod
    fun isAccessibilityEnabled(call: PluginCall) {
        val enabled = isAccessibilityServiceEnabled(context, SOSAccessibilityService::class.java)
        val result = com.getcapacitor.JSObject()
        result.put("enabled", enabled)
        call.resolve(result)
    }

    @PluginMethod
    fun openAccessibilitySettings(call: PluginCall) {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        context.startActivity(intent)
        call.resolve()
    }

    @PluginMethod
    fun triggerTestSOS(call: PluginCall) {
        val intent = Intent(context, SOSForegroundService::class.java)
        intent.action = SOSForegroundService.ACTION_TRIGGER_SOS
        context.startForegroundService(intent)
        call.resolve()
    }

    @PluginMethod
    fun stopSOS(call: PluginCall) {
        val intent = Intent(context, SOSForegroundService::class.java)
        intent.action = SOSForegroundService.ACTION_STOP_SOS
        context.startService(intent)
        call.resolve()
    }

    private fun isAccessibilityServiceEnabled(
        context: Context,
        serviceClass: Class<*>
    ): Boolean {
        val expectedComponentName = "${context.packageName}/${serviceClass.canonicalName}"
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServices)
        while (colonSplitter.hasNext()) {
            if (colonSplitter.next().equals(expectedComponentName, ignoreCase = true)) {
                return true
            }
        }
        return false
    }
}
