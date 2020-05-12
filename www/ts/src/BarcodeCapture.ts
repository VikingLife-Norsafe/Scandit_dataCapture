/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeCapture"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { BarcodeCaptureFeedback, BarcodeCaptureListener } from 'BarcodeCapture+Related';
import { BarcodeCaptureSettings } from 'BarcodeCaptureSettings';
import { CameraSettings } from 'Camera+Related';
import { BarcodeCaptureListenerProxy } from 'Cordova/BarcodeCaptureListenerProxy';
import { Cordova } from 'Cordova/Cordova';
import {
  DataCaptureContext,
  DataCaptureMode,
  PrivateDataCaptureContext,
  PrivateDataCaptureMode,
} from 'DataCaptureContext';
import { DefaultSerializeable, ignoreFromSerialization, nameForSerialization } from 'Serializeable';

export interface PrivateBarcodeCapture extends PrivateDataCaptureMode {
  _context: Optional<DataCaptureContext>;
  didChange: () => Promise<void>;
}

export class BarcodeCapture extends DefaultSerializeable implements DataCaptureMode {
  public get isEnabled(): boolean {
    return this._isEnabled;
  }

  public set isEnabled(isEnabled: boolean) {
    this._isEnabled = isEnabled;
    if (!this.isInListenerCallback) {
      // If we're "in" a listener callback, we don't want to deserialize the context to update the enabled state,
      // but rather pass that back to be applied in the native callback.
      this.didChange();
    }
  }

  public get context(): Optional<DataCaptureContext> {
    return this._context;
  }

  public get feedback(): BarcodeCaptureFeedback {
    return this._feedback;
  }

  public set feedback(feedback: BarcodeCaptureFeedback) {
    this._feedback = feedback;
    this.didChange();
  }

  public static get recommendedCameraSettings(): CameraSettings {
    return new CameraSettings(Cordova.defaults.BarcodeCapture.RecommendedCameraSettings);
  }

  private type = 'barcodeCapture';
  @nameForSerialization('enabled')
  private _isEnabled: boolean = true;

  @nameForSerialization('feedback')
  private _feedback: BarcodeCaptureFeedback = BarcodeCaptureFeedback.default;
  private settings: BarcodeCaptureSettings;

  @ignoreFromSerialization
  private _context: Optional<DataCaptureContext> = null;

  @ignoreFromSerialization
  private listeners: BarcodeCaptureListener[] = [];

  @ignoreFromSerialization
  private listenerProxy: Optional<BarcodeCaptureListenerProxy> = null;
  private isInListenerCallback = false;

  public static forContext(context: Optional<DataCaptureContext>, settings: BarcodeCaptureSettings): BarcodeCapture {
    const barcodeCapture = new BarcodeCapture();

    barcodeCapture.settings = settings;

    if (context) {
        context.addMode(barcodeCapture);
    }

    barcodeCapture.listenerProxy = BarcodeCaptureListenerProxy.forBarcodeCapture(barcodeCapture);

    return barcodeCapture;
  }

  public applySettings(settings: BarcodeCaptureSettings): Promise<void> {
    this.settings = settings;
    return this.didChange();
  }

  public addListener(listener: BarcodeCaptureListener): void {
    if (this.listeners.includes(listener)) {
      return;
    }
    this.listeners.push(listener);
  }

  public removeListener(listener: BarcodeCaptureListener): void {
    if (!this.listeners.includes(listener)) {
      return;
    }
    this.listeners.splice(this.listeners.indexOf(listener), 1);
  }

  private didChange(): Promise<void> {
    if (this.context) {
      return (this.context as any as PrivateDataCaptureContext).update();
    } else {
      return Promise.resolve();
    }
  }

}
