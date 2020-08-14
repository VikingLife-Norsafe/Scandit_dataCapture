import ScanditBarcodeCapture

// TODO: serialize frame data as argument (https://jira.scandit.com/browse/SDC-1014)
extension FrameData {
    func toJSON() -> CDVPluginResult.JSONMessage {
        return [:]
    }
}

class BarcodeCaptureCallbacks {
    var barcodeCaptureListener: Callback?
    var barcodeTrackingListener: Callback?
    var barcodeTrackingBasicOverlayListener: Callback?
    var barcodeTrackingAdvancedOverlayListener: Callback?

    func reset() {
        barcodeCaptureListener = nil
        barcodeTrackingListener = nil
        barcodeTrackingBasicOverlayListener = nil
        barcodeTrackingAdvancedOverlayListener = nil
    }
}

@objc(ScanditBarcodeCapture)
class ScanditBarcodeCapture: CDVPlugin, DataCapturePlugin {
    lazy var modeDeserializers: [DataCaptureModeDeserializer] = {
        let barcodeCaptureDeserializer = BarcodeCaptureDeserializer()
        barcodeCaptureDeserializer.delegate = self
        let barcodeTrackingDeserializer = BarcodeTrackingDeserializer()
        barcodeTrackingDeserializer.delegate = self
        return [barcodeCaptureDeserializer, barcodeTrackingDeserializer]
    }()

    lazy var componentDeserializers: [DataCaptureComponentDeserializer] = []
    lazy var components: [DataCaptureComponent] = []

    lazy var callbacks = BarcodeCaptureCallbacks()
    lazy var callbackLocks = CallbackLocks()

    lazy var basicOverlayListenerQueue = DispatchQueue(label: "basicOverlayListenerQueue")
    lazy var advancedOverlayListenerQueue = DispatchQueue(label: "advancedOverlayListenerQueue")
    var barcodeTrackingBasicOverlay: BarcodeTrackingBasicOverlay?
    var barcodeTrackingAdvancedOverlay: BarcodeTrackingAdvancedOverlay?
    var lastTrackedBarcodes: [NSNumber: TrackedBarcode]?
    var lastFrameSequenceId: Int?

    override func pluginInitialize() {
        super.pluginInitialize()
        ScanditCaptureCore.dataCapturePlugins.append(self)
    }

    override func onReset() {
        super.onReset()

        callbacks.reset()

        lastTrackedBarcodes = nil
        lastFrameSequenceId = nil

        callbackLocks.releaseAll()
    }

    @objc(getDefaults:)
    func getDefaults(command: CDVInvokedUrlCommand) {
        let settings = BarcodeCaptureSettings()
        let barcodeCapture = BarcodeCapture(context: nil, settings: settings)
        let barcodeTracking = BarcodeTracking(context: nil, settings: BarcodeTrackingSettings())
        let overlay = BarcodeCaptureOverlay(barcodeCapture: barcodeCapture)
        let basicTrackingOverlay = BarcodeTrackingBasicOverlay(barcodeTracking: barcodeTracking)

        let defaults = ScanditBarcodeCaptureDefaults(barcodeCaptureSettings: settings,
                                                     overlay: overlay,
                                                     basicTrackingOverlay: basicTrackingOverlay)

        commandDelegate.send(.success(message: defaults), callbackId: command.callbackId)
    }

    // MARK: Listeners

    @objc(subscribeBarcodeCaptureListener:)
    func subscribeBarcodeCaptureListener(command: CDVInvokedUrlCommand) {
        callbacks.barcodeCaptureListener?.dispose(by: commandDelegate)
        callbacks.barcodeCaptureListener = Callback(id: command.callbackId)
        commandDelegate.send(.keepCallback, callbackId: command.callbackId)
    }

    @objc(subscribeBarcodeTrackingListener:)
    func subscribeBarcodeTrackingListener(command: CDVInvokedUrlCommand) {
        callbacks.barcodeTrackingListener?.dispose(by: commandDelegate)
        callbacks.barcodeTrackingListener = Callback(id: command.callbackId)

        lastTrackedBarcodes = nil
        lastFrameSequenceId = nil

        commandDelegate.send(.keepCallback, callbackId: command.callbackId)
    }

    @objc(subscribeBarcodeTrackingBasicOverlayListener:)
    func subscribeBarcodeTrackingBasicOverlayListener(command: CDVInvokedUrlCommand) {
        callbacks.barcodeTrackingBasicOverlayListener?.dispose(by: commandDelegate)
        callbacks.barcodeTrackingBasicOverlayListener = Callback(id: command.callbackId)
        commandDelegate.send(.keepCallback, callbackId: command.callbackId)
    }

    @objc(subscribeBarcodeTrackingAdvancedOverlayListener:)
    func subscribeBarcodeTrackingAdvancedOverlayListener(command: CDVInvokedUrlCommand) {
        callbacks.barcodeTrackingAdvancedOverlayListener?.dispose(by: commandDelegate)
        callbacks.barcodeTrackingAdvancedOverlayListener = Callback(id: command.callbackId)
        commandDelegate.send(.keepCallback, callbackId: command.callbackId)
    }

    @objc(finishCallback:)
    func finishCallback(command: CDVInvokedUrlCommand) {
        guard let result = BarcodeCaptureCallbackResult.from(command) else {
            commandDelegate.send(.failure(with: .invalidJSON), callbackId: command.callbackId)
            return
        }
        callbackLocks.setResult(result, for: result.finishCallbackID)
        callbackLocks.release(for: result.finishCallbackID)
        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    @objc(setBrushForTrackedBarcode:)
    func setBrushForTrackedBarcode(command: CDVInvokedUrlCommand) {
        guard let json = try? BrushAndTrackedBarcodeJSON.fromCommand(command) else {
            commandDelegate.send(.failure(with: .invalidJSON), callbackId: command.callbackId)
            return
        }

        guard let trackedBarcode = trackedBarcode(withID: json.trackedBarcodeID,
                                                  inSession: json.sessionFrameSequenceID) else {
                                                    commandDelegate.send(.failure(with: .trackedBarcodeNotFound), callbackId: command.callbackId)
                                                    return
        }

        self.barcodeTrackingBasicOverlay?.setBrush(json.brush, for: trackedBarcode)
        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    @objc(clearTrackedBarcodeBrushes:)
    func clearTrackedBarcodeBrushes(command: CDVInvokedUrlCommand) {
        self.barcodeTrackingBasicOverlay?.clearTrackedBarcodeBrushes()
        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    @objc(setViewForTrackedBarcode:)
    func setViewForTrackedBarcode(command: CDVInvokedUrlCommand) {
        guard let json = try? ViewAndTrackedBarcodeJSON.fromCommand(command) else {
            commandDelegate.send(.failure(with: .invalidJSON), callbackId: command.callbackId)
            return
        }

        guard let trackedBarcode = trackedBarcode(withID: json.trackedBarcodeID,
                                                  inSession: json.sessionFrameSequenceID) else {
                                                    commandDelegate.send(.failure(with: .trackedBarcodeNotFound), callbackId: command.callbackId)
                                                    return
        }

        DispatchQueue.main.async {
            var trackedBarcodeView: TrackedBarcodeView?
            if let viewJSON = json.view {
                trackedBarcodeView = TrackedBarcodeView(json: viewJSON)
                trackedBarcodeView?.didTap = { [weak self] in
                    self?.didTapViewTrackedBarcode(trackedBarcode: trackedBarcode)
                }
            }

            self.barcodeTrackingAdvancedOverlay?.setView(trackedBarcodeView, for: trackedBarcode)

            self.commandDelegate.send(.success, callbackId: command.callbackId)
        }
    }

    @objc(setAnchorForTrackedBarcode:)
    func setAnchorForTrackedBarcode(command: CDVInvokedUrlCommand) {
        guard let json = try? AnchorAndTrackedBarcodeJSON.fromCommand(command) else {
            commandDelegate.send(.failure(with: .invalidJSON), callbackId: command.callbackId)
            return
        }

        guard let trackedBarcode = trackedBarcode(withID: json.trackedBarcodeID,
                                                  inSession: json.sessionFrameSequenceID) else {
                                                    commandDelegate.send(.failure(with: .trackedBarcodeNotFound), callbackId: command.callbackId)
                                                    return
        }

        guard let anchorString = json.anchor, let anchor = Anchor(JSONString: anchorString) else {
            commandDelegate.send(.failure(with: .invalidJSON), callbackId: command.callbackId)
            return
        }

        self.barcodeTrackingAdvancedOverlay?.setAnchor(anchor, for: trackedBarcode)

        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    @objc(setOffsetForTrackedBarcode:)
    func setOffsetForTrackedBarcode(command: CDVInvokedUrlCommand) {
        guard let json = try? OffsetAndTrackedBarcodeJSON.fromCommand(command) else {
            commandDelegate.send(.failure(with: .invalidJSON), callbackId: command.callbackId)
            return
        }

        guard let trackedBarcode = trackedBarcode(withID: json.trackedBarcodeID,
                                                  inSession: json.sessionFrameSequenceID) else {
                                                    commandDelegate.send(.failure(with: .trackedBarcodeNotFound), callbackId: command.callbackId)
                                                    return
        }

        guard let offsetString = json.offset, let offset = PointWithUnit(JSONString: offsetString) else {
            commandDelegate.send(.failure(with: .invalidJSON), callbackId: command.callbackId)
            return
        }

        self.barcodeTrackingAdvancedOverlay?.setOffset(offset, for: trackedBarcode)
        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    @objc(clearTrackedBarcodeViews:)
    func clearTrackedBarcodeViews(command: CDVInvokedUrlCommand) {
        self.barcodeTrackingAdvancedOverlay?.clearTrackedBarcodeViews()
        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    func waitForFinished(_ listenerEvent: ListenerEvent, callbackId: String) {
        callbackLocks.wait(for: listenerEvent.name, afterDoing: {
            commandDelegate.send(.listenerCallback(listenerEvent), callbackId: callbackId)
        })
    }

    func finishBlockingCallback(with mode: DataCaptureMode, for listenerEvent: ListenerEvent) {
        defer {
            callbackLocks.clearResult(for: listenerEvent.name)
        }

        guard let result = callbackLocks.getResult(for: listenerEvent.name) as? BarcodeCaptureCallbackResult,
            let enabled = result.enabled else {
            return
        }

        if enabled != mode.isEnabled {
            mode.isEnabled = enabled
        }
    }

    func finishBlockingCallback(with overlay: BarcodeTrackingBasicOverlay,
                                and trackedBarcode: TrackedBarcode,
                                for listenerEvent: ListenerEvent) {
        defer {
            callbackLocks.clearResult(for: listenerEvent.name)
        }

        /// No listener set.
        guard let callbackResult = callbackLocks.getResult(for: listenerEvent.name) as? BarcodeCaptureCallbackResult else {
            return
        }

        if callbackResult.isForListenerEvent(.brushForTrackedBarcode) {
            /// Listener didn't return a brush, e.g. set listener didn't implement the function.
            if callbackResult.result == nil {
                overlay.setBrush(overlay.brush, for: trackedBarcode)
                return
            }

            /// Listener returned null for brush.
            guard let brush = callbackResult.brush else {
                overlay.setBrush(nil, for: trackedBarcode)
                return
            }

            /// Listener returned a brush to be set.
            overlay.setBrush(brush, for: trackedBarcode)
        }

    }

    func finishBlockingCallback(with overlay: BarcodeTrackingAdvancedOverlay,
                                and trackedBarcode: TrackedBarcode,
                                for listenerEvent: ListenerEvent) {
        defer {
            callbackLocks.clearResult(for: listenerEvent.name)
        }

        /// No listener set.
        guard let callbackResult = callbackLocks.getResult(for: listenerEvent.name) as? BarcodeCaptureCallbackResult else {
            return
        }

        switch callbackResult.finishCallbackID {
        case .viewForTrackedBarcode:
            guard callbackResult.result != nil else {
                /// The JS listener didn't return a result, e.g. it didn't implement the relevant listener function
                /// **Note**: a `nil` view is different than no result:
                /// `nil` means the intention of setting no view, while the absense of a result means that there's no intention to set anything, e.g. views
                /// are set through `setView` instead of through the listener.
                return
            }
            DispatchQueue.main.async {
                callbackResult.view?.didTap = {
                    self.didTapViewTrackedBarcode(trackedBarcode: trackedBarcode)
                }
                overlay.setView(callbackResult.view, for: trackedBarcode)
            }
        case .anchorForTrackedBarcode:
            guard let anchor = callbackResult.anchor else {
                /// The JS listener didn't return a valid anchor, e.g. it didn't implement the relevant listener function.
                return
            }
            overlay.setAnchor(anchor, for: trackedBarcode)
        case .offsetForTrackedBarcode:
            guard let offset = callbackResult.offset else {
                /// The JS listener didn't return a valid offset, e.g. it didn't implement the relevant listener function.
                return
            }
            overlay.setOffset(offset, for: trackedBarcode)
        default:
            return
        }
    }

    private func trackedBarcode(withID trackedBarcodeId: String, inSession sessionFrameSequenceId: String?) -> TrackedBarcode? {
        guard let lastTrackedBarcodes = lastTrackedBarcodes, !lastTrackedBarcodes.isEmpty else {
            return nil
        }

        if let sessionId = sessionFrameSequenceId, lastFrameSequenceId != Int(sessionId) {
            return nil
        }

        guard let trackedBarcode = lastTrackedBarcodes.trackedBarcode(withID: trackedBarcodeId) else {
            return nil
        }

        return trackedBarcode
    }
}
