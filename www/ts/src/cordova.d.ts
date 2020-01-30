// Cordova will provide this require in the wrapper that the plugin JS gets wrapped into
declare function require(path: string): any;

interface SymbologySettingsJSON {
  enabled: boolean;
  colorInvertedEnabled: boolean;
  activeSymbolCounts: number[];
  checksums: string[];
  extensions: string[];
}

interface RangeJSON {
  minimum: number;
  maximum: number;
  step: number;
}

interface SymbologyDescriptionJSON {
  identifier: string;
  readableName: string;
  isAvailable: boolean;
  isColorInvertible: boolean;
  activeSymbolCountRange: RangeJSON;
  defaultSymbolCountRange: RangeJSON;
  supportedExtensions: string[];
}

type SymbologySettingsDefaults = { [key: string]: SymbologySettingsJSON };
type SymbologyDescriptions = SymbologyDescriptionJSON[];

interface Window {
  Scandit: {
    Defaults: {
      SymbologySettings: SymbologySettingsDefaults,
      SymbologyDescriptions: SymbologyDescriptions,
    }
  }
}
