import ScanditBarcodeCapture

extension ScanditBarcodeCapture: BarcodeCaptureListener {
    func barcodeCapture(_ barcodeCapture: BarcodeCapture,
                        didScanIn session: BarcodeCaptureSession,
                        frameData: FrameData) {
        guard let callback = callbacks.barcodeCaptureListener else {
            return
        }

        let event = ListenerEvent(name: .didScanInBarcodeCapture,
                                  argument: ["session": session.jsonString, "frameData": frameData.toJSON()],
                                  shouldNotifyWhenFinished: true)
        waitForFinished(.listenerCallback(event), callbackId: callback.id)
        finishBlockingCallback(with: barcodeCapture)
    }

    func barcodeCapture(_ barcodeCapture: BarcodeCapture,
                        didUpdate session: BarcodeCaptureSession,
                        frameData: FrameData) {
        guard let callback = callbacks.barcodeCaptureListener else {
            return
        }

        let event = ListenerEvent(name: .didUpdateSessionInBarcodeCapture,
                                  argument: ["session": session.jsonString, "frameData": frameData.toJSON()],
                                  shouldNotifyWhenFinished: true)
        waitForFinished(.listenerCallback(event), callbackId: callback.id)
        finishBlockingCallback(with: barcodeCapture)
    }

    func didStartObserving(_ barcodeCapture: BarcodeCapture) {
        // ignored in Cordova
    }

    func didStopObserving(_ barcodeCapture: BarcodeCapture) {
        // ignored in Cordova
    }
}
