/// <amd-module name="scandit-cordova-datacapture-barcode.Defaults"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import {
  PrivateSymbologyDescription,
  PrivateSymbologySettings,
  SymbologyDescription,
  SymbologySettings,
} from 'Barcode';
import { CameraSettings, PrivateCameraSettings } from 'Camera+Related';
import { Color, PrivateColor } from 'Common';
import { CameraSettingsDefaultsJSON, PrivateCameraSettingsDefaults } from 'CoreDefaults';

export interface Defaults {
  SymbologySettings: {
    [key: string]: SymbologySettings,
  };

  SymbologyDescriptions: SymbologyDescription[];

  BarcodeCapture: {
    BarcodeCaptureOverlay: {
      Brush: {
        fillColor: Color,
        strokeColor: Color,
        strokeWidth: number,
      },
    };

    BarcodeCaptureSettings: {
      codeDuplicateFilter: number,
    };

    RecommendedCameraSettings: CameraSettings;
  };

  BarcodeTracking: {
    RecommendedCameraSettings: CameraSettings;

    BarcodeTrackingBasicOverlay: {
      DefaultBrush: {
        fillColor: Color,
        strokeColor: Color,
        strokeWidth: number,
      },
    },
  };
}

export interface DefaultsJSON {
  SymbologySettings: {
    [key: string]: string,
  };

  SymbologyDescriptions: string[];

  BarcodeCapture: {
    BarcodeCaptureOverlay: {
      Brush: {
        fillColor: string,
        strokeColor: string,
        strokeWidth: number,
      },
    };

    BarcodeCaptureSettings: {
      codeDuplicateFilter: number,
    };

    RecommendedCameraSettings: CameraSettingsDefaultsJSON;
  };

  BarcodeTracking: {
    RecommendedCameraSettings: CameraSettingsDefaultsJSON,

    BarcodeTrackingBasicOverlay: {
      DefaultBrush: {
        fillColor: string,
        strokeColor: string,
        strokeWidth: number,
      },
    },
  };
}

export const defaultsFromJSON: (json: DefaultsJSON) => Defaults = (json: DefaultsJSON) => {
  return {
    SymbologySettings: Object.keys(json.SymbologySettings)
      .reduce((settings: { [key: string]: SymbologySettings }, identifier) => {
        settings[identifier] = (SymbologySettings as any as PrivateSymbologySettings)
          .fromJSON(JSON.parse(json.SymbologySettings[identifier]));
        return settings;
      }, {}),

    SymbologyDescriptions: json.SymbologyDescriptions.map(description =>
      (SymbologyDescription as any as PrivateSymbologyDescription).fromJSON(JSON.parse(description))),

    BarcodeCapture: {
      BarcodeCaptureOverlay: {
        Brush: {
          fillColor: (Color as any as PrivateColor)
            .fromJSON(json.BarcodeCapture.BarcodeCaptureOverlay.Brush.fillColor),
          strokeColor: (Color as any as PrivateColor)
            .fromJSON(json.BarcodeCapture.BarcodeCaptureOverlay.Brush.strokeColor),
          strokeWidth: json.BarcodeCapture.BarcodeCaptureOverlay.Brush.strokeWidth,
        },
      },

      BarcodeCaptureSettings: {
        codeDuplicateFilter: json.BarcodeCapture.BarcodeCaptureSettings.codeDuplicateFilter,
      },

      RecommendedCameraSettings: (CameraSettings as any as PrivateCameraSettingsDefaults)
        .fromJSON(json.BarcodeCapture.RecommendedCameraSettings),
    },

    BarcodeTracking: {
      RecommendedCameraSettings: (CameraSettings as any as PrivateCameraSettingsDefaults)
        .fromJSON(json.BarcodeTracking.RecommendedCameraSettings),

      BarcodeTrackingBasicOverlay: {
        DefaultBrush: {
          fillColor: (Color as any as PrivateColor)
            .fromJSON(json.BarcodeTracking.BarcodeTrackingBasicOverlay.DefaultBrush.fillColor),
          strokeColor: (Color as any as PrivateColor)
            .fromJSON(json.BarcodeTracking.BarcodeTrackingBasicOverlay.DefaultBrush.strokeColor),
          strokeWidth: json.BarcodeTracking.BarcodeTrackingBasicOverlay.DefaultBrush.strokeWidth,
        },
      },
    },
  };
};
