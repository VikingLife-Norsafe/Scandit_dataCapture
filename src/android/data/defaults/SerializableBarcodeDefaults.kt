/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.data.defaults

import com.scandit.datacapture.cordova.core.data.SerializableData
import org.json.JSONArray
import org.json.JSONObject

data class SerializableBarcodeDefaults(
        private val symbologySettingsDefaults: SerializableSymbologySettingsDefaults,
        private val symbologyDescriptionsDefaults: JSONArray,
        private val barcodeCaptureDefaults: SerializableBarcodeCaptureDefaults,
        private val barcodeTrackingDefaults: SerializableBarcodeTrackingDefaults
) : SerializableData {

    override fun toJson(): JSONObject = JSONObject(
            mapOf(
                    FIELD_SYMBOLOGY_SETTINGS_DEFAULTS to symbologySettingsDefaults.toJson(),
                    FIELD_SYMBOLOGY_DESCRIPTION_DEFAULTS to symbologyDescriptionsDefaults,
                    FIELD_BARCODE_CAPTURE_DEFAULTS to barcodeCaptureDefaults.toJson(),
                    FIELD_BARCODE_TRACKING_DEFAULTS to barcodeTrackingDefaults.toJson()
            )
    )

    companion object {
        private const val FIELD_BARCODE_CAPTURE_DEFAULTS = "BarcodeCapture"
        private const val FIELD_SYMBOLOGY_SETTINGS_DEFAULTS = "SymbologySettings"
        private const val FIELD_SYMBOLOGY_DESCRIPTION_DEFAULTS = "SymbologyDescriptions"
        private const val FIELD_BARCODE_TRACKING_DEFAULTS = "BarcodeTracking"
    }
}
