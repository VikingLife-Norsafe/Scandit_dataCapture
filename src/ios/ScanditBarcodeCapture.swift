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

    func reset() {
        barcodeCaptureListener = nil
        barcodeTrackingListener = nil
        barcodeTrackingBasicOverlayListener = nil
    }
}

extension CDVPluginResult {
    /// Success result with defaults.
    static func success(message: ScanditBarcodeCaptureDefaults) -> CDVPluginResult {
        guard let data = try? JSONEncoder().encode(message),
            let object = try? JSONSerialization.jsonObject(with: data) as? JSONMessage else {
                return .failure(with: "Could not serialize message")
        }
        return CDVPluginResult(status: CDVCommandStatus_OK, messageAs: object)
    }
}

struct BrushAndTrackedBarcodeJSON: CommandJSONArgument {
    enum CodingKeys: String, CodingKey {
        case trackedBarcodeID
        case sessionFrameSequenceID
        case brushJSONString = "brush"
    }

    let brushJSONString: String?
    let trackedBarcodeID: String
    let sessionFrameSequenceID: String?

    var brush: Brush? {
        guard let jsonString = brushJSONString else {
            return nil
        }

        return Brush(jsonString: jsonString)
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

    lazy var callbacks = BarcodeCaptureCallbacks()

    private var condition = NSCondition()
    private var isCallbackFinished = true
    private var callbackResult: BlockingListenerCallbackResult?

    lazy var overlayListenerQueue = DispatchQueue(label: "overlayListenerQueue")
    var barcodeTrackingBasicOverlay: BarcodeTrackingBasicOverlay?
    var lastBarcodeTrackingSession: BarcodeTrackingSession?

    override func pluginInitialize() {
        super.pluginInitialize()
        ScanditCaptureCore.dataCapturePlugins.append(self)
    }

    override func onReset() {
        super.onReset()

        callbacks.reset()

        lastBarcodeTrackingSession = nil

        isCallbackFinished = true
        condition.signal()
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
        commandDelegate.send(.keepCallback, callbackId: command.callbackId)
    }

    @objc(subscribeBarcodeTrackingBasicOverlayListener:)
    func subscribeBarcodeTrackingBasicOverlayListener(command: CDVInvokedUrlCommand) {
        callbacks.barcodeTrackingBasicOverlayListener?.dispose(by: commandDelegate)
        callbacks.barcodeTrackingBasicOverlayListener = Callback(id: command.callbackId)
        commandDelegate.send(.keepCallback, callbackId: command.callbackId)
    }

    @objc(finishCallback:)
    func finishCallback(command: CDVInvokedUrlCommand) {
        callbackResult = BlockingListenerCallbackResult.from(command)
        isCallbackFinished = true
        condition.signal()
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

        overlayListenerQueue.async {
            self.barcodeTrackingBasicOverlay?.setBrush(json.brush, for: trackedBarcode)
        }
        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    @objc(clearTrackedBarcodeBrushes:)
    func clearTrackedBarcodeBrushes(command: CDVInvokedUrlCommand) {
        overlayListenerQueue.async {
            self.barcodeTrackingBasicOverlay?.clearTrackedBarcodeBrushes()
        }
        commandDelegate.send(.success, callbackId: command.callbackId)
    }

    func waitForFinished(_ result: CDVPluginResult, callbackId: String) {
        condition.lock()
        isCallbackFinished = false
        commandDelegate.send(result, callbackId: callbackId)
        while !isCallbackFinished {
            condition.wait()
        }
        condition.unlock()
    }

    func finishBlockingCallback(with mode: DataCaptureMode) {
        guard let result = callbackResult, let enabled = result.enabled else {
            return
        }

        if result.result.enabled != mode.isEnabled {
            mode.isEnabled = enabled
        }

        callbackResult = nil
    }

    func finishBlockingCallback(with overlay: BarcodeTrackingBasicOverlay, and trackedBarcode: TrackedBarcode) {
        defer {
            callbackResult = nil
        }


        // No listener set, or listener does not implement the relevant function
        guard let callbackResult = callbackResult else {
            return
        }

        if callbackResult.isForListenerEvent(.brushForTrackedBarcode) {
            // Listener returned null for brush
            guard let brush = callbackResult.brush else {
                overlay.setBrush(nil, for: trackedBarcode)
                return
            }

            // Listener return a brush to be set
            overlay.setBrush(brush, for: trackedBarcode)
        }

    }

    private func trackedBarcode(withID trackedBarcodeID: String, inSession sessionFrameSequenceID: String?) -> TrackedBarcode? {
        guard let session = lastBarcodeTrackingSession, !session.trackedBarcodes.isEmpty else {
            return nil
        }

        if let sessionID = sessionFrameSequenceID, session.frameSequenceId != Int(sessionID) {
            return nil
        }

        guard let trackedBarcode = session.trackedBarcode(withID: trackedBarcodeID) else {
            return nil
        }

        return trackedBarcode
    }
}

