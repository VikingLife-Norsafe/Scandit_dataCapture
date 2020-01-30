import ScanditBarcodeCapture

extension ScanditBarcodeCapture: BarcodeTrackingListener {
    func barcodeTracking(_ barcodeTracking: BarcodeTracking,
                         didUpdate session: BarcodeTrackingSession,
                         frameData: FrameData) {
        guard let callback = callbacks.barcodeTrackingListener else {
            return
        }

        lastBarcodeTrackingSession = session

        let event = ListenerEvent(name: .didUpdateSessionInBarcodeTracking,
                                  argument: ["session": session.jsonString, "frameData": frameData.toJSON()],
                                  shouldNotifyWhenFinished: true)
        waitForFinished(.listenerCallback(event), callbackId: callback.id)
        finishBlockingCallback(with: barcodeTracking)
    }
}
