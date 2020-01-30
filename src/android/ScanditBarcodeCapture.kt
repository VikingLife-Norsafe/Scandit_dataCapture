/*
 * This file is part of the Scandit Data Capture SDK
 *
 * Copyright (C) 2019- Scandit AG. All rights reserved.
 */

package com.scandit.datacapture.cordova.barcode

import android.Manifest
import com.scandit.datacapture.barcode.capture.BarcodeCapture
import com.scandit.datacapture.barcode.capture.BarcodeCaptureDeserializer
import com.scandit.datacapture.barcode.capture.BarcodeCaptureDeserializerListener
import com.scandit.datacapture.barcode.capture.BarcodeCaptureListener
import com.scandit.datacapture.barcode.capture.BarcodeCaptureSession
import com.scandit.datacapture.barcode.tracking.capture.BarcodeTracking
import com.scandit.datacapture.barcode.tracking.capture.BarcodeTrackingDeserializer
import com.scandit.datacapture.barcode.tracking.capture.BarcodeTrackingDeserializerListener
import com.scandit.datacapture.barcode.tracking.capture.BarcodeTrackingListener
import com.scandit.datacapture.barcode.tracking.capture.BarcodeTrackingSession
import com.scandit.datacapture.barcode.tracking.data.TrackedBarcode
import com.scandit.datacapture.barcode.tracking.ui.overlay.BarcodeTrackingBasicOverlay
import com.scandit.datacapture.barcode.tracking.ui.overlay.BarcodeTrackingBasicOverlayListener
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
import com.scandit.datacapture.cordova.barcode.callbacks.BarcodeCallbackContainer
import com.scandit.datacapture.cordova.barcode.callbacks.BarcodeCaptureCallback
import com.scandit.datacapture.cordova.barcode.data.SerializableBrushAndTrackedBarcode
import com.scandit.datacapture.cordova.barcode.data.SerializableFinishBasicOverlayCallbackData
import com.scandit.datacapture.cordova.barcode.data.SerializableFinishModeCallbackData
import com.scandit.datacapture.cordova.barcode.errors.ErrorTrackedBarcodeNotFound
import com.scandit.datacapture.cordova.barcode.factories.BarcodeCaptureActionFactory
import com.scandit.datacapture.cordova.barcode.handlers.BarcodeCaptureHandler
import com.scandit.datacapture.cordova.barcode.tracking.callbacks.BarcodeTrackingBasicOverlayCallback
import com.scandit.datacapture.cordova.barcode.tracking.callbacks.BarcodeTrackingCallback
import com.scandit.datacapture.cordova.barcode.tracking.handlers.BarcodeTrackingBasicOverlayHandler
import com.scandit.datacapture.cordova.barcode.tracking.handlers.BarcodeTrackingHandler
import com.scandit.datacapture.cordova.core.communication.CameraPermissionGrantedListener
import com.scandit.datacapture.cordova.core.communication.ModeDeserializersProvider
import com.scandit.datacapture.cordova.core.errors.InvalidActionNameError
import com.scandit.datacapture.cordova.core.errors.JsonParseError
import com.scandit.datacapture.cordova.core.factories.ActionFactory
import com.scandit.datacapture.cordova.core.handlers.ActionsHandler
import com.scandit.datacapture.cordova.core.handlers.CameraPermissionsActionsHandlerHelper
import com.scandit.datacapture.core.capture.serialization.DataCaptureModeDeserializer
import com.scandit.datacapture.core.data.FrameData
import com.scandit.datacapture.core.json.JsonValue
import com.scandit.datacapture.core.ui.style.Brush
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.PluginResult
import org.json.JSONArray
import org.json.JSONObject

class ScanditBarcodeCapture : CordovaPlugin(),
        BarcodeCaptureListener,
        BarcodeTrackingListener,
        BarcodeTrackingBasicOverlayListener,
        BarcodeActionsListeners,
        BarcodeCaptureDeserializerListener,
        BarcodeTrackingDeserializerListener,
        CameraPermissionGrantedListener,
        ModeDeserializersProvider {

    private val actionFactory: ActionFactory = BarcodeCaptureActionFactory(this)
    private val actionsHandler: ActionsHandler = ActionsHandler(
            actionFactory, CameraPermissionsActionsHandlerHelper(actionFactory)
    )

    private val barcodeCallbacks: BarcodeCallbackContainer = BarcodeCallbackContainer()
    private val barcodeCaptureHandler: BarcodeCaptureHandler = BarcodeCaptureHandler(this)
    private val barcodeTrackingHandler: BarcodeTrackingHandler = BarcodeTrackingHandler(this)
    private val barcodeTrackingBasicOverlayHandler = BarcodeTrackingBasicOverlayHandler(this)

    private var lastBarcodeCaptureEnabledState: Boolean = false
    private var lastBarcodeTrackingEnabledState: Boolean = false

    override fun pluginInitialize() {
        super.pluginInitialize()

        if (cordova.hasPermission(Manifest.permission.CAMERA)) {
            onCameraPermissionGranted()
        }
    }

    override fun onStop() {
        barcodeCallbacks.forceRelease()

        lastBarcodeCaptureEnabledState = barcodeCaptureHandler.barcodeCapture?.isEnabled ?: false
        barcodeCaptureHandler.barcodeCapture?.isEnabled = false

        lastBarcodeTrackingEnabledState = barcodeTrackingHandler.barcodeTracking?.isEnabled ?: false
        barcodeTrackingHandler.barcodeTracking?.isEnabled = false
    }

    override fun onStart() {
        barcodeCaptureHandler.barcodeCapture?.isEnabled = lastBarcodeCaptureEnabledState
        barcodeTrackingHandler.barcodeTracking?.isEnabled = lastBarcodeTrackingEnabledState
    }

    override fun onReset() {
        barcodeCaptureHandler.disposeCurrent()
        barcodeTrackingHandler.disposeCurrent()
        barcodeTrackingBasicOverlayHandler.disposeCurrent()
        barcodeCallbacks.disposeAll()
    }

    override fun execute(
            action: String, args: JSONArray, callbackContext: CallbackContext
    ): Boolean {
        return try {
            actionsHandler.addAction(action, args, callbackContext)
        } catch (e: InvalidActionNameError) {
            false
        } catch (e: Exception) {
            e.printStackTrace()
            true
        }
    }

    //region BarcodeCaptureListener
    override fun onSessionUpdated(
            barcodeCapture: BarcodeCapture, session: BarcodeCaptureSession, data: FrameData
    ) {
        barcodeCallbacks.barcodeCaptureCallback?.onSessionUpdated(barcodeCapture, session, data)
    }

    override fun onBarcodeScanned(
            barcodeCapture: BarcodeCapture, session: BarcodeCaptureSession, data: FrameData
    ) {
        barcodeCallbacks.barcodeCaptureCallback?.onBarcodeScanned(barcodeCapture, session, data)
    }
    //endregion

    //region BarcodeTrackingListener
    override fun onSessionUpdated(
            mode: BarcodeTracking, session: BarcodeTrackingSession, data: FrameData
    ) {
        barcodeCallbacks.barcodeTrackingCallback?.onSessionUpdated(mode, session, data)
    }
    //endregion

    //region BarcodeTrackingBasicOverlayListener
    override fun brushForTrackedBarcode(
            overlay: BarcodeTrackingBasicOverlay, trackedBarcode: TrackedBarcode
    ): Brush? {
        return barcodeCallbacks.barcodeTrackingBasicOverlayCallback?.brushForTrackedBarcode(
                overlay, trackedBarcode, switchToOverlayWorker = true
        )
    }

    override fun onTrackedBarcodeTapped(
            overlay: BarcodeTrackingBasicOverlay, trackedBarcode: TrackedBarcode
    ) {
        barcodeCallbacks.barcodeTrackingBasicOverlayCallback?.onTrackedBarcodeTapped(
                overlay, trackedBarcode, switchToOverlayWorker = true
        )
    }
    //endregion

    //region CameraPermissionGrantedListener
    override fun onCameraPermissionGranted() {
        actionsHandler.onCameraPermissionGranted()
    }
    //endregion

    //region ModeDeserializersProvider
    override fun provideModeDeserializers(): List<DataCaptureModeDeserializer> = listOf(
            BarcodeCaptureDeserializer().also {
                it.listener = this
            },
            BarcodeTrackingDeserializer().also {
                it.listener = this
            }
    )
    //endregion

    //region BarcodeCaptureDeserializerListener
    override fun onModeDeserializationFinished(
            deserializer: BarcodeCaptureDeserializer, mode: BarcodeCapture, json: JsonValue
    ) {
        mode.updateFromJson(json.jsonString())
        mode.isEnabled = json.getByKeyAsBoolean("enabled", false)
        barcodeCaptureHandler.attachBarcodeCapture(mode)
    }
    //endregion

    //region BarcodeTrackingDeserializerListener
    override fun onModeDeserializationFinished(
            deserializer: BarcodeTrackingDeserializer, mode: BarcodeTracking, json: JsonValue
    ) {
        mode.updateFromJson(json.jsonString())
        mode.isEnabled = json.getByKeyAsBoolean("enabled", false)
        barcodeTrackingHandler.attachBarcodeTracking(mode)
    }

    override fun onBasicOverlayDeserializationStarted(
            deserializer: BarcodeTrackingDeserializer,
            overlay: BarcodeTrackingBasicOverlay,
            json: JsonValue
    ) {
        barcodeTrackingBasicOverlayHandler.attachOverlay(overlay)
    }
    //endregion

    //region Action callbacks
    override fun onJsonParseError(error: Throwable, callbackContext: CallbackContext) {
        JsonParseError(error.message).sendResult(callbackContext)
    }

    //region ActionInjectDefaults.ResultListener
    override fun onInjectDefaultsActionExecuted(
            default: JSONObject, callbackContext: CallbackContext
    ) {
        callbackContext.success(default)
    }
    //endregion

    //region ActionSubscribeBarcodeCapture.ResultListener
    override fun onBarcodeCaptureSubscribeActionExecuted(callbackContext: CallbackContext) {
        barcodeCallbacks.setBarcodeCaptureCallback(
                BarcodeCaptureCallback(actionsHandler, callbackContext)
        )
        callbackContext.sendPluginResult(// We notify the callback context to keep it alive.
                PluginResult(PluginResult.Status.OK).apply {
                    keepCallback = true
                }
        )
    }
    //endregion

    //region ActionSubscribeBarcodeTracking.ResultListener
    override fun onBarcodeTrackingSubscribeActionExecuted(callbackContext: CallbackContext) {
        barcodeCallbacks.setBarcodeTrackingCallback(
                BarcodeTrackingCallback(actionsHandler, callbackContext)
        )
        callbackContext.sendPluginResult(// We notify the callback context to keep it alive.
                PluginResult(PluginResult.Status.OK).apply {
                    keepCallback = true
                }
        )
    }
    //endregion

    //region ActionSendBarcodeScanned.ResultListener
    override fun onSendBarcodeScannedActionExecuted(
            message: JSONObject, callbackContext: CallbackContext
    ) {
        callbackContext.sendPluginResult(
                PluginResult(PluginResult.Status.OK, message).apply {
                    keepCallback = true
                }
        )
    }
    //endregion

    //region ActionSendSessionUpdated.ResultListener
    override fun onSendSessionUpdatedActionExecuted(
            message: JSONObject, callbackContext: CallbackContext
    ) {
        callbackContext.sendPluginResult(
                PluginResult(PluginResult.Status.OK, message).apply {
                    keepCallback = true
                }
        )
    }
    //endregion

    //region ActionSendTrackingSessionUpdated.ResultListener
    override fun onSendTrackingSessionUpdatedActionExecuted(
            message: JSONObject, callbackContext: CallbackContext
    ) {
        callbackContext.sendPluginResult(
                PluginResult(PluginResult.Status.OK, message).apply {
                    keepCallback = true
                }
        )
    }
    //endregion

    //region ActionFinishCallback.ResultListener
    override fun onFinishBarcodeCaptureModeCallbackActionExecuted(
            finishData: SerializableFinishModeCallbackData?, callbackContext: CallbackContext
    ) {
        barcodeCallbacks.onFinishBarcodeCaptureAction(finishData)
    }

    override fun onFinishBarcodeTrackingModeCallbackActionExecuted(
            finishData: SerializableFinishModeCallbackData?, callbackContext: CallbackContext
    ) {
        barcodeCallbacks.onFinishBarcodeTrackingAction(finishData)
    }

    override fun onFinishOverlayCallbackActionExecuted(
            finishData: SerializableFinishBasicOverlayCallbackData?, callbackContext: CallbackContext
    ) {
        barcodeCallbacks.onFinishOverlayAction(finishData)
    }
    //endregion

    //region ActionSubscribeBasicOverlay.ResultListener
    override fun onBarcodeTrackingBasicOverlaySubscribeActionExecuted(
            callbackContext: CallbackContext
    ) {
        barcodeCallbacks.setBarcodeTrackingBasicOverlayCallback(
                BarcodeTrackingBasicOverlayCallback(actionsHandler, callbackContext)
        )
        callbackContext.sendPluginResult(// We notify the callback context to keep it alive
                PluginResult(PluginResult.Status.OK).apply {
                    keepCallback = true
                }
        )
    }
    //endregion

    //region ActionClearTrackedBarcodeBrushes.ResultListener
    override fun onActionClearTrackedBarcodeBrushesExecuted(callbackContext: CallbackContext) {
        val barcodeTrackingBasicOverlayCallback =
                barcodeCallbacks.barcodeTrackingBasicOverlayCallback
                        ?: return callbackContext.success()
        val overlay = barcodeTrackingBasicOverlayHandler.barcodeTrackingBasicOverlay
                ?: return callbackContext.success()

        barcodeTrackingBasicOverlayCallback.clearBrushes(overlay, switchToOverlayWorker = true)
        callbackContext.success()
    }
    //endregion

    //region ActionSendBrushForTrackedBarcode.ResultListener
    override fun onSendBrushForTrackedBarcodeActionExecuted(
            message: JSONObject, callbackContext: CallbackContext
    ) {
        callbackContext.sendPluginResult(
                PluginResult(PluginResult.Status.OK, message).apply {
                    keepCallback = true
                }
        )
    }
    //endregion

    //region ActionSetBrushForTrackedBarcode.ResultListener
    override fun onSetBrushForTrackedBarcodeActionExecuted(
            parsedData: SerializableBrushAndTrackedBarcode, callbackContext: CallbackContext
    ) {
        val overlay = barcodeTrackingBasicOverlayHandler.barcodeTrackingBasicOverlay
                ?: return callbackContext.success()
        val barcodeTrackingCallback = barcodeCallbacks.barcodeTrackingCallback
                ?: return callbackContext.success()
        val barcodeTrackingBasicOverlayCallback =
                barcodeCallbacks.barcodeTrackingBasicOverlayCallback
                        ?: return callbackContext.success()

        val trackedBarcode = barcodeTrackingCallback.getTrackedBarcodeFromLatestSession(
                parsedData.trackedBarcodeId, parsedData.sessionFrameSequenceId
        )
        if (trackedBarcode == null) {
            ErrorTrackedBarcodeNotFound().sendResult(callbackContext)
        } else {
            barcodeTrackingBasicOverlayCallback.setBrushForTrackedBarcode(
                    trackedBarcode, parsedData.brush, overlay, switchToOverlayWorker = true
            )
            callbackContext.success()
        }
    }
    //endregion

    //region ActionSendTapOnTrackedBarcode.ResultListener
    override fun onSendTapOnTrackedBarcodeActionExecuted(
            message: JSONObject, callbackContext: CallbackContext
    ) {
        callbackContext.sendPluginResult(
                PluginResult(PluginResult.Status.OK, message).apply {
                    keepCallback = true
                }
        )
    }
    //endregion
    //endregion
}

interface BarcodeActionsListeners : ActionInjectDefaults.ResultListener,
        ActionSubscribeBarcodeCapture.ResultListener,
        ActionSubscribeBarcodeTracking.ResultListener,
        ActionSendSessionUpdated.ResultListener,
        ActionSendTrackingSessionUpdated.ResultListener,
        ActionSendBarcodeScanned.ResultListener,
        ActionFinishCallback.ResultListener,
        ActionSubscribeBasicOverlay.ResultListener,
        ActionClearTrackedBarcodeBrushes.ResultListener,
        ActionSendBrushForTrackedBarcode.ResultListener,
        ActionSetBrushForTrackedBarcode.ResultListener,
        ActionSendTapOnTrackedBarcode.ResultListener
