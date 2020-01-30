/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.data.defaults

import com.scandit.datacapture.barcode.capture.SymbologySettings
import com.scandit.datacapture.cordova.core.data.SerializableData
import com.scandit.datacapture.cordova.core.utils.camelCaseName
import org.json.JSONArray
import org.json.JSONObject

data class SerializableSymbologySettings(
        private val settings: SymbologySettings
) : SerializableData {

    override fun toJson(): JSONObject {
        return JSONObject(
                mapOf(
                        FIELD_ENABLED to settings.isEnabled,
                        FIELD_COLOR_INVERTED_ENABLED to settings.isColorInvertedEnabled,
                        FIELD_ACTIVE_SYMBOL_COUNT to JSONArray(settings.activeSymbolCounts),
                        FIELD_EXTENSIONS to JSONArray(settings.enabledExtensions),
                        FIELD_CHECKSUMS to settings.checksums.map { it.camelCaseName }
                )
        )
    }

    companion object {
        private const val FIELD_ENABLED = "enabled"
        private const val FIELD_COLOR_INVERTED_ENABLED = "colorInvertedEnabled"
        private const val FIELD_ACTIVE_SYMBOL_COUNT = "activeSymbolCounts"
        private const val FIELD_EXTENSIONS = "extensions"
        private const val FIELD_CHECKSUMS = "checksums"
    }
}
