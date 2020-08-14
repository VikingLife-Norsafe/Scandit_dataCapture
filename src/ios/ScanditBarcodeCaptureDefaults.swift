import ScanditBarcodeCapture

struct ScanditBarcodeCaptureDefaults: Encodable {
    typealias CameraSettingsDefaults = ScanditCaptureCoreDefaults.CameraSettingsDefaults

    struct BarcodeCaptureOverlayDefaults: Encodable {
        let Brush: ScanditCaptureCoreDefaults.BrushDefaults
    }

    struct BarcodeTrackingBasicOverlayDefaults: Encodable {
        let DefaultBrush: ScanditCaptureCoreDefaults.BrushDefaults
    }

    struct BarcodeCaptureSettingsDefaults: Encodable {
        let codeDuplicateFilter: Double
    }

    struct BarcodeCaptureDefaultsContainer: Encodable {
        let BarcodeCaptureOverlay: BarcodeCaptureOverlayDefaults
        let BarcodeCaptureSettings: BarcodeCaptureSettingsDefaults
        let RecommendedCameraSettings: CameraSettingsDefaults
    }

    struct BarcodeTrackingDefaultsContainer: Encodable {
        let BarcodeTrackingBasicOverlay: BarcodeTrackingBasicOverlayDefaults
        let RecommendedCameraSettings: CameraSettingsDefaults
    }

    typealias SymbologySettingsDefaults = [String: String]
    typealias SymbologyDescriptionsDefaults = [String]

    let BarcodeCapture: BarcodeCaptureDefaultsContainer
    let BarcodeTracking: BarcodeTrackingDefaultsContainer
    let SymbologySettings: SymbologySettingsDefaults
    let SymbologyDescriptions: SymbologyDescriptionsDefaults

    init(barcodeCaptureSettings: BarcodeCaptureSettings, overlay: BarcodeCaptureOverlay, basicTrackingOverlay: BarcodeTrackingBasicOverlay) {
        self.BarcodeCapture = BarcodeCaptureDefaultsContainer.from(barcodeCaptureSettings, overlay)
        self.BarcodeTracking = BarcodeTrackingDefaultsContainer.from(basicTrackingOverlay)
        self.SymbologySettings = SymbologySettingsDefaults.from(barcodeCaptureSettings)
        self.SymbologyDescriptions = SymbologyDescription.all.map { $0.jsonString }
    }
}

extension ScanditBarcodeCaptureDefaults.BarcodeCaptureDefaultsContainer {
    static func from(_ settings: BarcodeCaptureSettings, _ overlay: BarcodeCaptureOverlay) -> ScanditBarcodeCaptureDefaults.BarcodeCaptureDefaultsContainer {
        let barcodeCaptureOverlay = ScanditBarcodeCaptureDefaults.BarcodeCaptureOverlayDefaults.from(overlay)
        let barcodeCaptureSettings = ScanditBarcodeCaptureDefaults.BarcodeCaptureSettingsDefaults.from(settings)
        let cameraSettings = ScanditCaptureCoreDefaults.CameraSettingsDefaults.from(BarcodeCapture.recommendedCameraSettings)
        return ScanditBarcodeCaptureDefaults.BarcodeCaptureDefaultsContainer(BarcodeCaptureOverlay: barcodeCaptureOverlay, BarcodeCaptureSettings: barcodeCaptureSettings,
                                                                             RecommendedCameraSettings: cameraSettings)
    }
}

extension ScanditBarcodeCaptureDefaults.BarcodeTrackingDefaultsContainer {
    static func from(_ basicOverlay: BarcodeTrackingBasicOverlay) -> ScanditBarcodeCaptureDefaults.BarcodeTrackingDefaultsContainer {
        let barcodeTrackingOverlay = ScanditBarcodeCaptureDefaults.BarcodeTrackingBasicOverlayDefaults.from(basicOverlay)
        let cameraSettings = ScanditCaptureCoreDefaults.CameraSettingsDefaults.from(BarcodeTracking.recommendedCameraSettings)
        return ScanditBarcodeCaptureDefaults.BarcodeTrackingDefaultsContainer(BarcodeTrackingBasicOverlay: barcodeTrackingOverlay, RecommendedCameraSettings: cameraSettings)
    }
}

extension ScanditBarcodeCaptureDefaults.BarcodeCaptureOverlayDefaults {
    static func from(_ overlay: BarcodeCaptureOverlay) -> ScanditBarcodeCaptureDefaults.BarcodeCaptureOverlayDefaults {
        let brush = ScanditCaptureCoreDefaults.BrushDefaults.from(BarcodeCaptureOverlay.defaultBrush)
        return ScanditBarcodeCaptureDefaults.BarcodeCaptureOverlayDefaults(Brush: brush)
    }
}

extension ScanditBarcodeCaptureDefaults.BarcodeTrackingBasicOverlayDefaults {
    static func from(_ basicOverlay: BarcodeTrackingBasicOverlay) -> ScanditBarcodeCaptureDefaults.BarcodeTrackingBasicOverlayDefaults {
        let brush = ScanditCaptureCoreDefaults.BrushDefaults.from(BarcodeTrackingBasicOverlay.defaultBrush)
        return ScanditBarcodeCaptureDefaults.BarcodeTrackingBasicOverlayDefaults(DefaultBrush: brush)
    }
}

extension ScanditBarcodeCaptureDefaults.BarcodeCaptureSettingsDefaults {
    static func from(_ settings: BarcodeCaptureSettings) ->
        ScanditBarcodeCaptureDefaults.BarcodeCaptureSettingsDefaults {
            return ScanditBarcodeCaptureDefaults.BarcodeCaptureSettingsDefaults(codeDuplicateFilter:
                settings.codeDuplicateFilter)
    }
}

extension ScanditBarcodeCaptureDefaults.SymbologySettingsDefaults {
    static func from(_ settings: BarcodeCaptureSettings) -> ScanditBarcodeCaptureDefaults.SymbologySettingsDefaults {
        return SymbologyDescription.all.reduce(
            into: [String: String](), {(result, symbologyDescription) in
                let symbology = SymbologyDescription.symbology(fromIdentifier: symbologyDescription.identifier)
                let settings = settings.settings(for: symbology)
                result[symbologyDescription.identifier] = settings.jsonString
        })
    }
}
