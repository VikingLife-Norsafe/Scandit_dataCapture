import ScanditBarcodeCapture

extension Dictionary where Key == NSNumber, Value == TrackedBarcode {
    func trackedBarcode(withID id: String) -> TrackedBarcode? {
        guard let trackedBarcodeID = Int(id),
            let trackedBarcode = self[NSNumber(integerLiteral: trackedBarcodeID)] else {
                return nil
        }

        return trackedBarcode
    }
}
