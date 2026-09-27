package com.antigravity.meatguideoverlay.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "meat_guide_settings")

class PreferencesManager(private val context: Context) {

    companion object {
        /** The store's ordering kiosk app (erum 이오더). */
        const val STORE_KIOSK_PACKAGE = "com.erum.epos"

        val KEY_SETUP_COMPLETED = booleanPreferencesKey("setup_completed")
        val KEY_SELECTED_KIOSK_PKG = stringPreferencesKey("selected_kiosk_pkg")
        val KEY_CHAR_X = intPreferencesKey("char_pos_x")
        val KEY_CHAR_Y = intPreferencesKey("char_pos_y")
        val KEY_CHAR_SIDE = stringPreferencesKey("char_side") // "LEFT" or "RIGHT"
        val KEY_SPEECH_BUBBLE_MODE = stringPreferencesKey("speech_bubble_mode")
        val KEY_DEVICE_NAME = stringPreferencesKey("device_name")
        val KEY_AUTO_LAUNCH_KIOSK = booleanPreferencesKey("auto_launch_kiosk")
        val KEY_LAST_SYNC_TIME = longPreferencesKey("last_sync_time")
        val KEY_LAST_SYNC_ERROR = stringPreferencesKey("last_sync_error")
        val KEY_SAVED_CONTENT_VERSION = longPreferencesKey("saved_content_version")
    }

    val isSetupCompletedFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_SETUP_COMPLETED] ?: false
    }

    val selectedKioskPackageFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_SELECTED_KIOSK_PKG] ?: STORE_KIOSK_PACKAGE
    }

    val charPositionFlow: Flow<Triple<Int, Int, String>> = context.dataStore.data.map { prefs ->
        Triple(
            prefs[KEY_CHAR_X] ?: -1,
            prefs[KEY_CHAR_Y] ?: 300,
            prefs[KEY_CHAR_SIDE] ?: "LEFT"
        )
    }

    val deviceNameFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_DEVICE_NAME] ?: "테이블-01"
    }

    val autoLaunchKioskFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_AUTO_LAUNCH_KIOSK] ?: false
    }

    val speechBubbleModeFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_SPEECH_BUBBLE_MODE] ?: "TIMEOUT_THEN_CHAR_ONLY"
    }

    val characterSideFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_CHAR_SIDE] ?: "LEFT"
    }

    suspend fun setSetupCompleted(completed: Boolean) {
        context.dataStore.edit { it[KEY_SETUP_COMPLETED] = completed }
    }

    suspend fun setSelectedKioskPackage(pkgName: String) {
        context.dataStore.edit { it[KEY_SELECTED_KIOSK_PKG] = pkgName }
    }

    suspend fun saveCharacterPosition(x: Int, y: Int, side: String) {
        context.dataStore.edit {
            it[KEY_CHAR_X] = x
            it[KEY_CHAR_Y] = y
            it[KEY_CHAR_SIDE] = side
        }
    }

    suspend fun saveCharacterSide(side: String) {
        context.dataStore.edit {
            it[KEY_CHAR_SIDE] = side
        }
    }

    suspend fun setDeviceName(name: String) {
        context.dataStore.edit { it[KEY_DEVICE_NAME] = name }
    }

    suspend fun setAutoLaunchKiosk(enabled: Boolean) {
        context.dataStore.edit { it[KEY_AUTO_LAUNCH_KIOSK] = enabled }
    }

    suspend fun setSpeechBubbleMode(mode: String) {
        context.dataStore.edit { it[KEY_SPEECH_BUBBLE_MODE] = mode }
    }

    suspend fun recordSyncResult(success: Boolean, errorMsg: String = "", version: Long = 1L) {
        context.dataStore.edit {
            it[KEY_LAST_SYNC_TIME] = System.currentTimeMillis()
            it[KEY_LAST_SYNC_ERROR] = if (success) "" else errorMsg
            if (success) {
                it[KEY_SAVED_CONTENT_VERSION] = version
            }
        }
    }

    suspend fun isSetupCompleted(): Boolean {
        return context.dataStore.data.first()[KEY_SETUP_COMPLETED] ?: false
    }

    suspend fun getSelectedKioskPackage(): String {
        return context.dataStore.data.first()[KEY_SELECTED_KIOSK_PKG] ?: STORE_KIOSK_PACKAGE
    }
}
