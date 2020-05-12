/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeCapture+Related"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import {
  Barcode,
  BarcodeJSON,
  LocalizedOnlyBarcode,
  LocalizedOnlyBarcodeJSON,
  PrivateBarcode,
  PrivateLocalizedOnlyBarcode,
} from 'Barcode';
import { BarcodeCapture, PrivateBarcodeCapture } from 'BarcodeCapture';
import { Cordova } from 'Cordova/Cordova';
import { DataCaptureOverlay, DataCaptureView } from 'DataCaptureView';
import { Feedback } from 'Feedback';
import { DefaultSerializeable, nameForSerialization, serializationDefault } from 'Serializeable';
import { Brush, Viewfinder } from 'Viewfinder';

export class BarcodeCaptureSession {
  private _newlyRecognizedBarcodes: Barcode[];
  private _newlyLocalizedBarcodes: LocalizedOnlyBarcode[];
  private _frameSequenceID: number;

  public get newlyRecognizedBarcodes(): Barcode[] {
    return this._newlyRecognizedBarcodes;
  }
  public get newlyLocalizedBarcodes(): LocalizedOnlyBarcode[] {
    return this._newlyLocalizedBarcodes;
  }
  public get frameSequenceID(): number {
    return this._frameSequenceID;
  }

  private static fromJSON(json: BarcodeCaptureSessionJSON): BarcodeCaptureSession {
    const session = new BarcodeCaptureSession();
    session._newlyRecognizedBarcodes = json.newlyRecognizedBarcodes
      .map((Barcode as any as PrivateBarcode).fromJSON);
    session._newlyLocalizedBarcodes = json.newlyLocalizedBarcodes
      .map((LocalizedOnlyBarcode as any as PrivateLocalizedOnlyBarcode).fromJSON);
    session._frameSequenceID = json.frameSequenceId;
    return session;
  }
}

export interface BarcodeCaptureSessionJSON {
  newlyRecognizedBarcodes: BarcodeJSON[];
  newlyLocalizedBarcodes: LocalizedOnlyBarcodeJSON[];
  frameSequenceId: number;
}

export interface PrivateBarcodeCaptureSession {
  fromJSON(json: BarcodeCaptureSessionJSON): BarcodeCaptureSession;
}

export interface BarcodeCaptureListener {
  // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
  didScan?(barcodeCapture: BarcodeCapture, session: BarcodeCaptureSession): void;
  didUpdateSession?(barcodeCapture: BarcodeCapture, session: BarcodeCaptureSession): void;
}

export class BarcodeCaptureFeedback extends DefaultSerializeable {
  public success: Feedback = Feedback.defaultFeedback;

  public static get default(): BarcodeCaptureFeedback {
    return new BarcodeCaptureFeedback();
  }
}

// tslint:disable-next-line:variable-name
const NoViewfinder = { type: 'none' };

export class BarcodeCaptureOverlay extends DefaultSerializeable implements DataCaptureOverlay {
  private type = 'barcodeCapture';

  private barcodeCapture: BarcodeCapture;

  @nameForSerialization('shouldShowScanAreaGuides')
  private _shouldShowScanAreaGuides: boolean = false;

  @serializationDefault(NoViewfinder)
  @nameForSerialization('viewfinder')
  private _viewfinder: Optional<Viewfinder> = null;

  public static get defaultBrush(): Brush {
    return new Brush(
      Cordova.defaults.BarcodeCapture.BarcodeCaptureOverlay.Brush.fillColor,
      Cordova.defaults.BarcodeCapture.BarcodeCaptureOverlay.Brush.strokeColor,
      Cordova.defaults.BarcodeCapture.BarcodeCaptureOverlay.Brush.strokeWidth,
    );
  }

  public brush: Brush = BarcodeCaptureOverlay.defaultBrush;

  public get viewfinder(): Optional<Viewfinder> {
    return this._viewfinder;
  }

  public set viewfinder(newViewfinder: Optional<Viewfinder>) {
    this._viewfinder = newViewfinder;
    (this.barcodeCapture as any as PrivateBarcodeCapture).didChange();
  }

  public get shouldShowScanAreaGuides(): boolean {
    return this._shouldShowScanAreaGuides;
  }

  public set shouldShowScanAreaGuides(newViewfinder: boolean) {
    this._shouldShowScanAreaGuides = newViewfinder;
    (this.barcodeCapture as any as PrivateBarcodeCapture).didChange();
  }

  public static withBarcodeCapture(barcodeCapture: BarcodeCapture): BarcodeCaptureOverlay {
    return BarcodeCaptureOverlay.withBarcodeCaptureForView(barcodeCapture, null);
  }

  public static withBarcodeCaptureForView(
    barcodeCapture: BarcodeCapture, view: Optional<DataCaptureView>): BarcodeCaptureOverlay {
    const overlay = new BarcodeCaptureOverlay();
    overlay.barcodeCapture = barcodeCapture;
    if (view) {
      view.addOverlay(overlay);
    }
    return overlay;
  }
}
