/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.callbacks

import com.scandit.datacapture.cordova.barcode.data.SerializableFinishBasicOverlayCallbackData
import com.scandit.datacapture.cordova.barcode.data.SerializableFinishModeCallbackData
import com.scandit.datacapture.cordova.barcode.tracking.callbacks.BarcodeTrackingBasicOverlayCallback
import com.scandit.datacapture.cordova.barcode.tracking.callbacks.BarcodeTrackingCallback

class BarcodeCallbackContainer {

    var barcodeCaptureCallback: BarcodeCaptureCallback? = null
        private set

    var barcodeTrackingCallback: BarcodeTrackingCallback? = null
        private set

    var barcodeTrackingBasicOverlayCallback: BarcodeTrackingBasicOverlayCallback? = null
        private set

    fun setBarcodeCaptureCallback(barcodeCaptureCallback: BarcodeCaptureCallback) {
        disposeBarcodeCaptureCallback()
        this.barcodeCaptureCallback = barcodeCaptureCallback
    }

    fun setBarcodeTrackingCallback(barcodeTrackingCallback: BarcodeTrackingCallback) {
        disposeBarcodeTrackingCallback()
        this.barcodeTrackingCallback = barcodeTrackingCallback
    }

    fun setBarcodeTrackingBasicOverlayCallback(
            barcodeTrackingBasicOverlayCallback: BarcodeTrackingBasicOverlayCallback
    ) {
        disposeBarcodeTrackingBasicOverlayCallback()
        this.barcodeTrackingBasicOverlayCallback = barcodeTrackingBasicOverlayCallback
    }

    fun disposeAll() {
        disposeBarcodeCaptureCallback()
        disposeBarcodeTrackingCallback()
        disposeBarcodeTrackingBasicOverlayCallback()
    }

    fun onFinishBarcodeCaptureAction(finishData: SerializableFinishModeCallbackData?) {
        barcodeCaptureCallback?.onFinishCallback(finishData)
    }

    fun onFinishBarcodeTrackingAction(finishData: SerializableFinishModeCallbackData?) {
        barcodeTrackingCallback?.onFinishCallback(finishData)
    }

    fun onFinishOverlayAction(finishData: SerializableFinishBasicOverlayCallbackData?) {
        barcodeTrackingBasicOverlayCallback?.onFinishCallback(finishData)
    }

    fun forceRelease() {
        barcodeCaptureCallback?.forceRelease()
        barcodeTrackingCallback?.forceRelease()
        barcodeTrackingBasicOverlayCallback?.forceRelease()
    }

    private fun disposeBarcodeCaptureCallback() {
        barcodeCaptureCallback?.dispose()
        barcodeCaptureCallback = null
    }

    private fun disposeBarcodeTrackingCallback() {
        barcodeTrackingCallback?.dispose()
        barcodeTrackingCallback = null
    }

    private fun disposeBarcodeTrackingBasicOverlayCallback() {
        barcodeTrackingBasicOverlayCallback?.dispose()
        barcodeTrackingBasicOverlayCallback = null
    }
}
