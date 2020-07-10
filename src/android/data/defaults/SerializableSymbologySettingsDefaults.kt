/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.data.defaults

import com.scandit.datacapture.barcode.capture.BarcodeCaptureSettings
import com.scandit.datacapture.barcode.data.SymbologyDescription
import com.scandit.datacapture.cordova.core.data.SerializableData
import org.json.JSONObject

data class SerializableSymbologySettingsDefaults(
        private val barcodeCaptureSettings: BarcodeCaptureSettings
) : SerializableData {

    override fun toJson(): JSONObject = JSONObject(
            SymbologyDescription.all().associate {
                val settings = barcodeCaptureSettings.getSymbologySettings(it.symbology)
                // TODO SDC-3881 once the native sdk makes SymbologySettings.toJson() available
                //  we can simply map it.identifier to settings.toJson()
                it.identifier to SerializableSymbologySettings(settings).toJson().toString()
            }
    )
}
