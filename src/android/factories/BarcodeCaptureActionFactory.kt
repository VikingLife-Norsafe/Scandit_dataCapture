/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode.factories

import com.scandit.datacapture.cordova.barcode.BarcodeActionsListeners
import com.scandit.datacapture.cordova.barcode.actions.ActionClearTrackedBarcodeBrushes
import com.scandit.datacapture.cordova.barcode.actions.ActionFinishCallback
import com.scandit.datacapture.cordova.barcode.actions.ActionInjectDefaults
import com.scandit.datacapture.cordova.barcode.actions.ActionSendBarcodeScanned
import com.scandit.datacapture.cordova.barcode.actions.ActionSendBrushForTrackedBarcode
import com.scandit.datacapture.cordova.barcode.actions.ActionSendSessionUpdated
import com.scandit.datacapture.cordova.barcode.actions.ActionSendTapOnTrackedBarcode
import com.scandit.datacapture.cordova.barcode.actions.ActionSendTrackingSessionUpdated
import com.scandit.datacapture.cordova.barcode.actions.ActionSetBrushForTrackedBarcode
import com.scandit.datacapture.cordova.barcode.actions.ActionSubscribeBarcodeCapture
import com.scandit.datacapture.cordova.barcode.actions.ActionSubscribeBarcodeTracking
import com.scandit.datacapture.cordova.barcode.actions.ActionSubscribeBasicOverlay
import com.scandit.datacapture.cordova.barcode.utils.FinishCallbackHelper
import com.scandit.datacapture.cordova.core.actions.Action
import com.scandit.datacapture.cordova.core.errors.InvalidActionNameError
import com.scandit.datacapture.cordova.core.factories.ActionFactory

class BarcodeCaptureActionFactory(
        private val listener: BarcodeActionsListeners
) : ActionFactory {

    override val actionsNotDependentOnCameraPermission = ACTIONS_NOT_DEPENDING_ON_CAMERA

    @Throws(InvalidActionNameError::class)
    override fun provideAction(actionName: String): Action {
        return when (actionName) {
            INJECT_DEFAULTS -> createActionInjectDefaults()
            SUBSCRIBE_BARCODE_CAPTURE -> createActionSubscribeBarcodeCapture()
            SUBSCRIBE_BARCODE_TRACKING -> createActionSubscribeBarcodeTracking()
            SEND_SESSION_UPDATED_EVENT -> createActionSessionUpdated()
            SEND_BARCODE_SCANNED_EVENT -> createActionBarcodeScanned()
            SEND_BRUSH_FOR_TRACKED_BARCODE -> createActionBrushForTrackedBarcode()
            SEND_DID_TAP_TRACKED_BARCODE -> createActionTapOnTrackedBarcode()
            FINISH_BLOCKING_ACTION -> createActionFinishBlocking()
            SEND_TRACKING_SESSION_UPDATED_EVENT -> createActionTrackingSessionUpdated()
            SUBSCRIBE_BASIC_OVERLAY_LISTENER -> createActionSubscribeBasicOverlay()
            SET_BRUSH_FOR_TRACKED_BARCODE -> createActionSetBrushForTrackedBarcode()
            CLEAR_TRACKED_BARCODE_BRUSHES -> createActionClearTrackedBarcodeBrushes()
            else -> throw InvalidActionNameError(actionName)
        }
    }

    private fun createActionInjectDefaults(): Action = ActionInjectDefaults(listener)

    private fun createActionSubscribeBarcodeCapture(): Action = ActionSubscribeBarcodeCapture(
            listener
    )

    private fun createActionSubscribeBarcodeTracking(): Action = ActionSubscribeBarcodeTracking(
            listener
    )

    private fun createActionSessionUpdated(): Action = ActionSendSessionUpdated(listener)

    private fun createActionBarcodeScanned(): Action = ActionSendBarcodeScanned(listener)

    private fun createActionFinishBlocking(): Action = ActionFinishCallback(
            listener, FinishCallbackHelper()
    )

    private fun createActionTrackingSessionUpdated(): Action = ActionSendTrackingSessionUpdated(
            listener
    )

    private fun createActionSubscribeBasicOverlay(): Action = ActionSubscribeBasicOverlay(
            listener
    )

    private fun createActionSetBrushForTrackedBarcode(): Action = ActionSetBrushForTrackedBarcode(
            listener
    )

    private fun createActionClearTrackedBarcodeBrushes(): Action = ActionClearTrackedBarcodeBrushes(
            listener
    )

    private fun createActionBrushForTrackedBarcode(): Action = ActionSendBrushForTrackedBarcode(
            listener
    )

    private fun createActionTapOnTrackedBarcode(): Action = ActionSendTapOnTrackedBarcode(
            listener
    )

    companion object {
        private const val INJECT_DEFAULTS = "getDefaults"
        private const val SUBSCRIBE_BARCODE_CAPTURE = "subscribeBarcodeCaptureListener"
        private const val SUBSCRIBE_BARCODE_TRACKING = "subscribeBarcodeTrackingListener"
        private const val FINISH_BLOCKING_ACTION = "finishCallback"
        private const val SUBSCRIBE_BASIC_OVERLAY_LISTENER =
                "subscribeBarcodeTrackingBasicOverlayListener"
        private const val SET_BRUSH_FOR_TRACKED_BARCODE = "setBrushForTrackedBarcode"
        private const val CLEAR_TRACKED_BARCODE_BRUSHES = "clearTrackedBarcodeBrushes"

        const val SEND_BRUSH_FOR_TRACKED_BARCODE = "sendBrushForTrackedBarcodeEvent"
        const val SEND_DID_TAP_TRACKED_BARCODE = "sendDidTapTrackedBarcodeEvent"
        const val SEND_SESSION_UPDATED_EVENT = "sendSessionUpdateEvent"
        const val SEND_BARCODE_SCANNED_EVENT = "sendBarcodeScannedEvent"
        const val SEND_TRACKING_SESSION_UPDATED_EVENT = "sendTrackingSessionUpdateEvent"

        private val ACTIONS_NOT_DEPENDING_ON_CAMERA = setOf(INJECT_DEFAULTS)
    }
}
