/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.actions

import com.scandit.datacapture.cordova.barcode.data.SerializableFinishBasicOverlayCallbackData
import com.scandit.datacapture.cordova.barcode.data.SerializableFinishModeCallbackData
import com.scandit.datacapture.cordova.barcode.utils.FinishCallbackHelper
import com.scandit.datacapture.cordova.core.actions.Action
import org.apache.cordova.CallbackContext
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class ActionFinishCallback(
        private val listener: ResultListener,
        private val helper: FinishCallbackHelper
) : Action {

    override fun run(args: JSONArray, callbackContext: CallbackContext): Boolean {
        try {
            val data = args.getJSONObject(0)
            if (!data.has(FIELD_RESULT)) {// We need the "result" field to exist ( null is also allowed )
                throw JSONException("Missing $FIELD_RESULT field in response json")
            }
            val result: JSONObject? = data.optJSONObject(FIELD_RESULT)
            when {
                helper.isFinishBarcodeCaptureModeCallback(data) -> {
                    finishBarcodeCaptureModeCallback(
                            SerializableFinishModeCallbackData.fromJson(result), callbackContext
                    )
                }
                helper.isFinishBarcodeTrackingModeCallback(data) -> {
                    finishBarcodeTrackingModeCallback(
                            SerializableFinishModeCallbackData.fromJson(result), callbackContext
                    )
                }
                helper.isFinishBarcodeTrackingOverlayCallback(data) -> {
                    finishBasicOverlayCallback(
                            SerializableFinishBasicOverlayCallbackData.fromJson(result),
                            callbackContext
                    )
                }
                else -> {
                    throw JSONException("Cannot recognise finish callback action with data $data")
                }
            }
        } catch (e: JSONException) {
            e.printStackTrace()
            listener.onJsonParseError(e, callbackContext)
        } catch (e: RuntimeException) {// TODO [SDC-1851] - fine-catch deserializer exceptions
            e.printStackTrace()
            listener.onJsonParseError(e, callbackContext)
        }
        return true
    }

    private fun finishBarcodeCaptureModeCallback(
            data: SerializableFinishModeCallbackData?, callbackContext: CallbackContext
    ) {
        listener.onFinishBarcodeCaptureModeCallbackActionExecuted(data, callbackContext)
    }

    private fun finishBarcodeTrackingModeCallback(
            data: SerializableFinishModeCallbackData?, callbackContext: CallbackContext
    ) {
        listener.onFinishBarcodeTrackingModeCallbackActionExecuted(data, callbackContext)
    }

    private fun finishBasicOverlayCallback(
            data: SerializableFinishBasicOverlayCallbackData?, callbackContext: CallbackContext
    ) {
        listener.onFinishOverlayCallbackActionExecuted(data, callbackContext)
    }

    companion object {
        private const val FIELD_RESULT = "result"
    }

    interface ResultListener {
        fun onFinishBarcodeTrackingModeCallbackActionExecuted(
                finishData: SerializableFinishModeCallbackData?, callbackContext: CallbackContext
        )

        fun onFinishBarcodeCaptureModeCallbackActionExecuted(
                finishData: SerializableFinishModeCallbackData?, callbackContext: CallbackContext
        )

        fun onFinishOverlayCallbackActionExecuted(
                finishData: SerializableFinishBasicOverlayCallbackData?,
                callbackContext: CallbackContext
        )

        fun onJsonParseError(error: Throwable, callbackContext: CallbackContext)
    }
}
