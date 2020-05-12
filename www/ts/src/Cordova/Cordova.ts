/// <amd-module name="scandit-cordova-datacapture-barcode.Cordova"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { PrivateSymbologyDescription, SymbologyDescription } from 'Barcode';
import { cordovaExec, initializePlugin } from 'Cordova/CommonCordova';

import { Defaults, defaultsFromJSON, DefaultsJSON } from './Defaults';

// tslint:disable-next-line:variable-name
export const Cordova = {
  pluginName: 'ScanditBarcodeCapture',
  defaults: {} as Defaults,
  exec: (
    success: Optional<Function>,
    error: Optional<Function>,
    functionName: string,
    args: Optional<[any]>,
  ) => cordovaExec(success, error, Cordova.pluginName, functionName, args),
};

const getDefaults: Promise<void> = new Promise((resolve, reject) => {
  Cordova.exec(
    (defaultsJSON: DefaultsJSON) => {
      Cordova.defaults = defaultsFromJSON(defaultsJSON);
      resolve();
    },
    reject,
    'getDefaults',
    null);
});

initializePlugin(Cordova.pluginName, getDefaults);

// To circumvent a circular dependency
(SymbologyDescription as any as PrivateSymbologyDescription).defaults = () => Cordova.defaults;

export enum CordovaFunction {
  SubscribeBarcodeCaptureListener = 'subscribeBarcodeCaptureListener',

  SubscribeBarcodeTrackingListener = 'subscribeBarcodeTrackingListener',

  SubscribeBarcodeTrackingBasicOverlayListener = 'subscribeBarcodeTrackingBasicOverlayListener',
  SetBrushForTrackedBarcode = 'setBrushForTrackedBarcode',
  ClearTrackedBarcodeBrushes = 'clearTrackedBarcodeBrushes',

  SubscribeBarcodeTrackingAdvancedOverlayListener = 'subscribeBarcodeTrackingAdvancedOverlayListener',
  SetViewForTrackedBarcode = 'setViewForTrackedBarcode',
  SetAnchorForTrackedBarcode = 'setAnchorForTrackedBarcode',
  SetOffsetForTrackedBarcode = 'setOffsetForTrackedBarcode',
  ClearTrackedBarcodeViews = 'clearTrackedBarcodeViews',
}
