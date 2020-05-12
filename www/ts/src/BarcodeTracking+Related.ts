/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeTracking+Related"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { PrivateTrackedBarcode, TrackedBarcode, TrackedBarcodeJSON } from 'Barcode';
import { BarcodeTracking, PrivateBarcodeTracking } from 'BarcodeTracking';
import { PointWithUnit } from 'Common';
import { BarcodeTrackingAdvancedOverlayProxy } from 'Cordova/BarcodeTrackingAdvancedOverlayProxy';
import { BarcodeTrackingBasicOverlayProxy } from 'Cordova/BarcodeTrackingBasicOverlayProxy';
import { Cordova } from 'Cordova/Cordova';
import { Anchor, DataCaptureOverlay, DataCaptureView } from 'DataCaptureView';
import { DefaultSerializeable, ignoreFromSerialization, nameForSerialization } from 'Serializeable';
import { TrackedBarcodeView } from 'TrackedBarcodeView';
import { Brush } from 'Viewfinder';

export interface BarcodeTrackingSessionJSON {
  addedTrackedBarcodes: TrackedBarcodeJSON[];
  removedTrackedBarcodes: string[];
  updatedTrackedBarcodes: TrackedBarcodeJSON[];
  trackedBarcodes: { [key: string]: TrackedBarcodeJSON };
  frameSequenceId: number;
}

export interface PrivateBarcodeTrackingSession {
  fromJSON(json: BarcodeTrackingSessionJSON): BarcodeTrackingSession;
}

export class BarcodeTrackingSession {
  private _addedTrackedBarcodes: TrackedBarcode[];
  private _removedTrackedBarcodes: string[];
  private _updatedTrackedBarcodes: TrackedBarcode[];
  private _trackedBarcodes: { [key: string]: TrackedBarcode };
  private _frameSequenceID: number;

  public get addedTrackedBarcodes(): TrackedBarcode[] {
    return this._addedTrackedBarcodes;
  }

  public get removedTrackedBarcodes(): string[] {
    return this._removedTrackedBarcodes;
  }

  public get updatedTrackedBarcodes(): TrackedBarcode[] {
    return this._updatedTrackedBarcodes;
  }

  public get trackedBarcodes(): { [key: string]: TrackedBarcode } {
    return this._trackedBarcodes;
  }

  public get frameSequenceID(): number {
    return this._frameSequenceID;
  }

  private static fromJSON(json: BarcodeTrackingSessionJSON): BarcodeTrackingSession {
    const session = new BarcodeTrackingSession();
    session._frameSequenceID = json.frameSequenceId;

    session._addedTrackedBarcodes = json.addedTrackedBarcodes
      .map((TrackedBarcode as any as PrivateTrackedBarcode).fromJSON);
    session._removedTrackedBarcodes = json.removedTrackedBarcodes;
    session._updatedTrackedBarcodes = json.updatedTrackedBarcodes
      .map((TrackedBarcode as any as PrivateTrackedBarcode).fromJSON);

    session._trackedBarcodes = Object.keys(json.trackedBarcodes)
      .reduce((trackedBarcodes, identifier) => {
        const trackedBarcode = (TrackedBarcode as any as PrivateTrackedBarcode)
          .fromJSON(json.trackedBarcodes[identifier]);
        (trackedBarcode as any as PrivateTrackedBarcode).sessionFrameSequenceID = `${json.frameSequenceId}`;
        trackedBarcodes[identifier] = trackedBarcode;
        return trackedBarcodes;
      }, {} as { [key: string]: TrackedBarcode });

    return session;
  }
}

export interface BarcodeTrackingListener {
  // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
  didUpdateSession?(barcodeTracking: BarcodeTracking, session: BarcodeTrackingSession): void;
}

export interface BarcodeTrackingBasicOverlayListener {
  brushForTrackedBarcode?(overlay: BarcodeTrackingBasicOverlay, trackedBarcode: TrackedBarcode): Optional<Brush>;
  didTapTrackedBarcode?(overlay: BarcodeTrackingBasicOverlay, trackedBarcode: TrackedBarcode): void;
}

export interface PrivateBarcodeTrackingBasicOverlay {
  toJSON(): object;
}

export class BarcodeTrackingBasicOverlay extends DefaultSerializeable implements DataCaptureOverlay {
  private type = 'barcodeTrackingBasic';

  @ignoreFromSerialization
  private barcodeTracking: BarcodeTracking;

  @nameForSerialization('defaultBrush')
  private _defaultBrush: Optional<Brush> = new Brush(
    Cordova.defaults.BarcodeTracking.BarcodeTrackingBasicOverlay.DefaultBrush.fillColor,
    Cordova.defaults.BarcodeTracking.BarcodeTrackingBasicOverlay.DefaultBrush.strokeColor,
    Cordova.defaults.BarcodeTracking.BarcodeTrackingBasicOverlay.DefaultBrush.strokeWidth,
  );

  public get defaultBrush(): Optional<Brush> {
    return this._defaultBrush;
  }

  public set defaultBrush(newBrush: Optional<Brush>) {
    this._defaultBrush = newBrush;
    (this.barcodeTracking as any as PrivateBarcodeTracking).didChange();
  }

  @nameForSerialization('shouldShowScanAreaGuides')
  private _shouldShowScanAreaGuides: boolean = false;

  @ignoreFromSerialization
  public listener: Optional<BarcodeTrackingBasicOverlayListener> = null;

  @ignoreFromSerialization
  private _proxy: BarcodeTrackingBasicOverlayProxy;

  private get proxy(): BarcodeTrackingBasicOverlayProxy {
    if (!this._proxy) {
      this.initialize();
    }
    return this._proxy as BarcodeTrackingBasicOverlayProxy;
  }

  public get shouldShowScanAreaGuides(): boolean {
    return this._shouldShowScanAreaGuides;
  }

  public set shouldShowScanAreaGuides(newViewfinder: boolean) {
    this._shouldShowScanAreaGuides = newViewfinder;
    (this.barcodeTracking as any as PrivateBarcodeTracking).didChange();
  }

  public static withBarcodeTracking(barcodeTracking: BarcodeTracking): BarcodeTrackingBasicOverlay {
    return BarcodeTrackingBasicOverlay.withBarcodeTrackingForView(barcodeTracking, null);
  }

  public static withBarcodeTrackingForView(
    barcodeTracking: BarcodeTracking, view: Optional<DataCaptureView>): BarcodeTrackingBasicOverlay {
    const overlay = new BarcodeTrackingBasicOverlay();
    overlay.barcodeTracking = barcodeTracking;

    if (view) {
      view.addOverlay(overlay);
    }

    overlay.initialize();

    return overlay;
  }

  public setBrushForTrackedBarcode(brush: Brush, trackedBarcode: TrackedBarcode): Promise<void> {
    return this.proxy.setBrushForTrackedBarcode(brush, trackedBarcode);
  }

  public clearTrackedBarcodeBrushes(): Promise<void> {
    return this.proxy.clearTrackedBarcodeBrushes();
  }

  private initialize(): void {
    if (this._proxy) {
      return;
    }
    this._proxy = BarcodeTrackingBasicOverlayProxy.forOverlay(this);
  }
}

export interface BarcodeTrackingAdvancedOverlayListener {
  viewForTrackedBarcode?(
    overlay: BarcodeTrackingAdvancedOverlay, trackedBarcode: TrackedBarcode): Promise<Optional<TrackedBarcodeView>>;
  anchorForTrackedBarcode?(overlay: BarcodeTrackingAdvancedOverlay, trackedBarcode: TrackedBarcode): Anchor;
  offsetForTrackedBarcode?(overlay: BarcodeTrackingAdvancedOverlay, trackedBarcode: TrackedBarcode): PointWithUnit;
  didTapViewForTrackedBarcode?(overlay: BarcodeTrackingAdvancedOverlay, trackedBarcode: TrackedBarcode): void;
}

export interface PrivateBarcodeTrackingAdvancedOverlay {
  toJSON(): object;
}

export class BarcodeTrackingAdvancedOverlay extends DefaultSerializeable implements DataCaptureOverlay {
  private type = 'barcodeTrackingAdvanced';

  @ignoreFromSerialization
  private barcodeTracking: BarcodeTracking;

  @ignoreFromSerialization
  public listener: Optional<BarcodeTrackingAdvancedOverlayListener> = null;

  @ignoreFromSerialization
  private _proxy: BarcodeTrackingAdvancedOverlayProxy;

  private get proxy(): BarcodeTrackingAdvancedOverlayProxy {
    if (!this._proxy) {
      this.initialize();
    }
    return this._proxy as BarcodeTrackingAdvancedOverlayProxy;
  }

  public static withBarcodeTrackingForView(
    barcodeTracking: BarcodeTracking, view: Optional<DataCaptureView>): BarcodeTrackingAdvancedOverlay {
    const overlay = new BarcodeTrackingAdvancedOverlay();
    overlay.barcodeTracking = barcodeTracking;

    if (view) {
      view.addOverlay(overlay);
    }

    overlay.initialize();

    return overlay;
  }

  public setViewForTrackedBarcode(
    view: Promise<Optional<TrackedBarcodeView>>, trackedBarcode: TrackedBarcode): Promise<void> {
    return this.proxy.setViewForTrackedBarcode(view, trackedBarcode);
  }

  public setAnchorForTrackedBarcode(anchor: Anchor, trackedBarcode: TrackedBarcode): Promise<void> {
    return this.proxy.setAnchorForTrackedBarcode(anchor, trackedBarcode);
  }

  public setOffsetForTrackedBarcode(offset: PointWithUnit, trackedBarcode: TrackedBarcode): Promise<void> {
    return this.proxy.setOffsetForTrackedBarcode(offset, trackedBarcode);
  }

  public clearTrackedBarcodeViews(): Promise<void> {
    return this.proxy.clearTrackedBarcodeViews();
  }

  private initialize(): void {
    if (this._proxy) {
      return;
    }

    this._proxy = BarcodeTrackingAdvancedOverlayProxy.forOverlay(this);
  }
}
