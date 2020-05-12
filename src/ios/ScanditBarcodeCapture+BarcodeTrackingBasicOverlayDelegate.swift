import ScanditBarcodeCapture

extension ScanditBarcodeCapture: BarcodeTrackingBasicOverlayDelegate {
    func barcodeTrackingBasicOverlay(_ overlay: BarcodeTrackingBasicOverlay,
                                     brushFor trackedBarcode: TrackedBarcode) -> Brush? {
        guard let callback = callbacks.barcodeTrackingBasicOverlayListener else {
            return overlay.defaultBrush
        }

        let listenerEvent = ListenerEvent(name: .brushForTrackedBarcode,
                                  argument: ["trackedBarcode": trackedBarcode.jsonString],
                                  shouldNotifyWhenFinished: true)

        // This callback is called on the main thread, so, if we wait for the JS layer to come back with a brush,
        // that'll block the main thread, so the 'finishCallback' can't get through to resolve the block.
        basicOverlayListenerQueue.async { [weak self] in
            guard let self = self else {
                return
            }

            self.waitForFinished(listenerEvent, callbackId: callback.id)
            self.finishBlockingCallback(with: overlay, and: trackedBarcode, for: listenerEvent)
        }

        return Brush.transparent
    }

    func barcodeTrackingBasicOverlay(_ overlay: BarcodeTrackingBasicOverlay,
                                     didTap trackedBarcode: TrackedBarcode) {
        guard let callback = callbacks.barcodeTrackingBasicOverlayListener else {
            return
        }

        let event = ListenerEvent(name: .didTapTrackedBarcode,
                                  argument: ["trackedBarcode": trackedBarcode.jsonString])
        commandDelegate.send(.listenerCallback(event), callbackId: callback.id)
    }
}
