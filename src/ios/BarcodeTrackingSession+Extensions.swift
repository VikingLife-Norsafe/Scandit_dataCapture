import ScanditBarcodeCapture

extension BarcodeTrackingSession {
    func trackedBarcode(withID id: String) -> TrackedBarcode? {
        guard let trackedBarcodeID = Int(id),
            let trackedBarcode = trackedBarcodes[NSNumber(integerLiteral: trackedBarcodeID)] else {
                return nil
        }

        return trackedBarcode
    }
}
