/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.utils

import com.scandit.datacapture.cordova.barcode.actions.ActionSendBarcodeScanned
import com.scandit.datacapture.cordova.barcode.actions.ActionSendBrushForTrackedBarcode
import com.scandit.datacapture.cordova.barcode.actions.ActionSendSessionUpdated
import com.scandit.datacapture.cordova.barcode.actions.ActionSendTrackingSessionUpdated
import com.scandit.datacapture.cordova.core.data.SerializableCallbackAction
import org.json.JSONObject

class FinishCallbackHelper {

    fun isFinishBarcodeCaptureModeCallback(data: JSONObject): Boolean {
        return checkFinishCallbackIdFieldForValue(data, ActionSendBarcodeScanned.ACTION_NAME)
                || checkFinishCallbackIdFieldForValue(data, ActionSendSessionUpdated.ACTION_NAME)
    }

    fun isFinishBarcodeTrackingModeCallback(data: JSONObject): Boolean {
        return checkFinishCallbackIdFieldForValue(
                data, ActionSendTrackingSessionUpdated.ACTION_NAME
        )
    }

    fun isFinishBarcodeTrackingOverlayCallback(data: JSONObject): Boolean {
        return checkFinishCallbackIdFieldForValue(
                data, ActionSendBrushForTrackedBarcode.ACTION_NAME
        )
    }

    private fun checkFinishCallbackIdFieldForValue(data: JSONObject, value: String): Boolean {
        return data.has(SerializableCallbackAction.FIELD_FINISH_CALLBACK_ID)
                && data[SerializableCallbackAction.FIELD_FINISH_CALLBACK_ID] == value
    }
}
