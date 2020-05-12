/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.actions

import com.scandit.datacapture.barcode.capture.BarcodeCapture
import com.scandit.datacapture.barcode.capture.BarcodeCaptureSettings
import com.scandit.datacapture.barcode.data.SymbologyDescription
import com.scandit.datacapture.barcode.tracking.capture.BarcodeTracking
import com.scandit.datacapture.barcode.tracking.capture.BarcodeTrackingSettings
import com.scandit.datacapture.barcode.tracking.ui.overlay.BarcodeTrackingBasicOverlay
import com.scandit.datacapture.barcode.ui.overlay.BarcodeCaptureOverlay
import com.scandit.datacapture.cordova.barcode.data.defaults.SerializableBarcodeCaptureDefaults
import com.scandit.datacapture.cordova.barcode.data.defaults.SerializableBarcodeCaptureOverlayDefaults
import com.scandit.datacapture.cordova.barcode.data.defaults.SerializableBarcodeCaptureSettingsDefaults
import com.scandit.datacapture.cordova.barcode.data.defaults.SerializableBarcodeDefaults
import com.scandit.datacapture.cordova.barcode.data.defaults.SerializableBarcodeTrackingDefaults
import com.scandit.datacapture.cordova.barcode.data.defaults.SerializableSymbologySettingsDefaults
import com.scandit.datacapture.cordova.barcode.data.defaults.SerializableTrackingBasicOverlayDefaults
import com.scandit.datacapture.cordova.core.actions.Action
import com.scandit.datacapture.cordova.core.actions.ActionJsonParseErrorResultListener
import com.scandit.datacapture.cordova.core.data.defaults.SerializableBrushDefaults
import com.scandit.datacapture.cordova.core.data.defaults.SerializableCameraSettingsDefault
import org.apache.cordova.CallbackContext
import org.json.JSONArray
import org.json.JSONException

class ActionInjectDefaults(
        private val listener: ResultListener
) : Action {

    override fun run(args: JSONArray, callbackContext: CallbackContext) {
        try {
            val captureSettings = BarcodeCaptureSettings()
            val brush = BarcodeCaptureOverlay.defaultBrush()
            val symbologyDescriptions = SymbologyDescription.all()
            val captureCameraSettings = BarcodeCapture.createRecommendedCameraSettings()

            val trackingSettings = BarcodeTrackingSettings()
            val trackingCameraSettings = BarcodeTracking.createRecommendedCameraSettings()
            val barcodeTracking = BarcodeTracking.forDataCaptureContext(null, trackingSettings)
            val overlay = BarcodeTrackingBasicOverlay.newInstance(barcodeTracking, null)

            val defaults = SerializableBarcodeDefaults(
                    barcodeCaptureDefaults = SerializableBarcodeCaptureDefaults(
                            barcodeCaptureOverlayDefaults = SerializableBarcodeCaptureOverlayDefaults(
                                    brushDefaults = SerializableBrushDefaults(
                                            brush = brush
                                    )
                            ),
                            barcodeCaptureSettingsDefaults = SerializableBarcodeCaptureSettingsDefaults(
                                    codeDuplicateFilter = captureSettings.codeDuplicateFilter.asSeconds()
                            ),
                            recommendedCameraSettings = SerializableCameraSettingsDefault(
                                    settings = captureCameraSettings
                            )
                    ),
                    symbologySettingsDefaults = SerializableSymbologySettingsDefaults(
                            barcodeCaptureSettings = captureSettings
                    ),
                    symbologyDescriptionsDefaults = JSONArray(
                            symbologyDescriptions.map { it.toJson() }
                    ),
                    barcodeTrackingDefaults = SerializableBarcodeTrackingDefaults(
                            recommendedCameraSettings = SerializableCameraSettingsDefault(
                                    settings = trackingCameraSettings
                            ),
                            trackingBasicOverlayDefaults = SerializableTrackingBasicOverlayDefaults(
                                    defaultBrush = SerializableBrushDefaults(
                                            brush = overlay.defaultBrush
                                    )
                            )
                    )
            )
            listener.onBarcodeDefaults(defaults, callbackContext)
        } catch (e: JSONException) {
            e.printStackTrace()
            listener.onJsonParseError(e, callbackContext)
        }
    }

    interface ResultListener : ActionJsonParseErrorResultListener {
        fun onBarcodeDefaults(
                defaults: SerializableBarcodeDefaults, callbackContext: CallbackContext
        )
    }
}
