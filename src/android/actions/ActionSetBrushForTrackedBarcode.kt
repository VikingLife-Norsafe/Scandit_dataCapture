/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.actions

import com.scandit.datacapture.cordova.barcode.data.SerializableBrushAndTrackedBarcode
import com.scandit.datacapture.cordova.core.actions.Action
import org.apache.cordova.CallbackContext
import org.json.JSONArray
import org.json.JSONException

class ActionSetBrushForTrackedBarcode(
        private val listener: ResultListener
) : Action {

    override fun run(args: JSONArray, callbackContext: CallbackContext): Boolean {
        try {
            val parsedData = SerializableBrushAndTrackedBarcode(
                    args.getJSONObject(0)
            )
            listener.onSetBrushForTrackedBarcodeActionExecuted(parsedData, callbackContext)
        } catch (e: JSONException) {
            e.printStackTrace()
            listener.onJsonParseError(e, callbackContext)
        } catch (e: RuntimeException) {// TODO [SDC-1851] - fine-catch deserializer exceptions
            e.printStackTrace()
            listener.onJsonParseError(e, callbackContext)
        }
        return true
    }

    interface ResultListener {
        fun onSetBrushForTrackedBarcodeActionExecuted(
                parsedData: SerializableBrushAndTrackedBarcode, callbackContext: CallbackContext
        )

        fun onJsonParseError(error: Throwable, callbackContext: CallbackContext)
    }
}
