/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeTrackingAdvancedOverlayProxy"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { PrivateTrackedBarcode, TrackedBarcode } from 'Barcode';
import { BarcodeTrackingAdvancedOverlay } from 'BarcodeTracking+Related';
import { PointWithUnit } from 'Common';
import { Anchor } from 'DataCaptureView';
import { Serializeable } from 'Serializeable';
import { PrivateTrackedBarcodeView, TrackedBarcodeView } from 'TrackedBarcodeView';

import { Cordova, CordovaFunction } from './Cordova';

enum BarcodeTrackingAdvancedOverlayListenerEvent {
  ViewForTrackedBarcode = 'viewForTrackedBarcode',
  AnchorForTrackedBarcode = 'anchorForTrackedBarcode',
  OffsetForTrackedBarcode = 'offsetForTrackedBarcode',
  DidTapViewForTrackedBarcode = 'didTapViewForTrackedBarcode',
}

interface BlockingBarcodeTrackingAdvancedOverlayResult {
  view?: Optional<string>;
  anchor?: string;
  offset?: string;
}

export class BarcodeTrackingAdvancedOverlayProxy {
  private static cordovaExec = Cordova.exec;
  private overlay: BarcodeTrackingAdvancedOverlay;

  public static forOverlay(overlay: BarcodeTrackingAdvancedOverlay): BarcodeTrackingAdvancedOverlayProxy {
    const proxy = new BarcodeTrackingAdvancedOverlayProxy();
    proxy.overlay = overlay;
    proxy.initialize();
    return proxy;
  }

  public setViewForTrackedBarcode(
    view: Promise<Optional<TrackedBarcodeView>>, trackedBarcode: TrackedBarcode): Promise<void> {
    if (view instanceof Promise) {
      return view.then(v => this.setViewForTrackedBarcodeSync(v, trackedBarcode));
    } else {
      return this.setViewForTrackedBarcodeSync(view, trackedBarcode);
    }
  }

  private setViewForTrackedBarcodeSync(
    view: Optional<TrackedBarcodeView>, trackedBarcode: TrackedBarcode): Promise<void> {
    return new Promise((resolve, reject) => {
      BarcodeTrackingAdvancedOverlayProxy.cordovaExec(
        resolve,
        reject,
        CordovaFunction.SetViewForTrackedBarcode,
        [{
          view: view ? (view as any as Serializeable).toJSON() : null,
          sessionFrameSequenceID: (trackedBarcode as any as PrivateTrackedBarcode).sessionFrameSequenceID,
          trackedBarcodeID: trackedBarcode.identifier,
        }],
      );
    });
  }

  public setAnchorForTrackedBarcode(anchor: Anchor, trackedBarcode: TrackedBarcode): Promise<void> {
    return new Promise((resolve, reject) => {
      BarcodeTrackingAdvancedOverlayProxy.cordovaExec(
        resolve,
        reject,
        CordovaFunction.SetAnchorForTrackedBarcode,
        [{
          anchor,
          sessionFrameSequenceID: (trackedBarcode as any as PrivateTrackedBarcode).sessionFrameSequenceID,
          trackedBarcodeID: trackedBarcode.identifier,
        }],
      );
    });
  }

  public setOffsetForTrackedBarcode(offset: PointWithUnit, trackedBarcode: TrackedBarcode): Promise<void> {
    return new Promise((resolve, reject) => {
      BarcodeTrackingAdvancedOverlayProxy.cordovaExec(
        resolve,
        reject,
        CordovaFunction.SetOffsetForTrackedBarcode,
        [{
          offset: offset ? JSON.stringify((offset as any as Serializeable).toJSON()) : null,
          sessionFrameSequenceID: (trackedBarcode as any as PrivateTrackedBarcode).sessionFrameSequenceID,
          trackedBarcodeID: trackedBarcode.identifier,
        }],
      );
    });
  }

  public clearTrackedBarcodeViews(): Promise<void> {
    return new Promise((resolve, reject) => {
      BarcodeTrackingAdvancedOverlayProxy.cordovaExec(
        resolve,
        reject,
        CordovaFunction.ClearTrackedBarcodeViews,
        null,
      );
    });
  }

  private subscribeListener() {
    BarcodeTrackingAdvancedOverlayProxy.cordovaExec(
      this.notifyListeners.bind(this),
      null,
      CordovaFunction.SubscribeBarcodeTrackingAdvancedOverlayListener,
      null,
    );
  }

  private notifyListeners(
    event: {
      name: BarcodeTrackingAdvancedOverlayListenerEvent,
      argument: any,
    }): Optional<BlockingBarcodeTrackingAdvancedOverlayResult> {
    if (!event || !this.overlay.listener) {
      // The event could be undefined/null in case the plugin result did not pass a "message",
      // which could happen e.g. in case of "ok" results, which could signal e.g. successful
      // listener subscriptions.
      return null;
    }

    switch (event.name) {
      case BarcodeTrackingAdvancedOverlayListenerEvent.ViewForTrackedBarcode:
        if (this.overlay.listener.viewForTrackedBarcode) {
          const trackedBarcode = (TrackedBarcode as any as PrivateTrackedBarcode)
            .fromJSON(JSON.parse(event.argument.trackedBarcode));
          const view = this.overlay.listener.viewForTrackedBarcode(this.overlay, trackedBarcode);
          if (view instanceof Promise) {
            this.setViewForTrackedBarcode(view, trackedBarcode);
            return { view: null };
          } else {
            return { view: view ? (view as any as PrivateTrackedBarcodeView).toJSON() : null };
          }
        }
        break;

      case BarcodeTrackingAdvancedOverlayListenerEvent.AnchorForTrackedBarcode:
        if (this.overlay.listener.anchorForTrackedBarcode) {
          const trackedBarcode = (TrackedBarcode as any as PrivateTrackedBarcode)
            .fromJSON(JSON.parse(event.argument.trackedBarcode));
          const anchor = this.overlay.listener.anchorForTrackedBarcode(this.overlay, trackedBarcode);
          return { anchor };
        }
        break;

      case BarcodeTrackingAdvancedOverlayListenerEvent.OffsetForTrackedBarcode:
        if (this.overlay.listener.offsetForTrackedBarcode) {
          const trackedBarcode = (TrackedBarcode as any as PrivateTrackedBarcode)
            .fromJSON(JSON.parse(event.argument.trackedBarcode));
          const offset = this.overlay.listener.offsetForTrackedBarcode(this.overlay, trackedBarcode);
          return { offset: JSON.stringify(offset.toJSON()) };
        }
        break;

      case BarcodeTrackingAdvancedOverlayListenerEvent.DidTapViewForTrackedBarcode:
        if (this.overlay.listener.didTapViewForTrackedBarcode) {
          const trackedBarcode = (TrackedBarcode as any as PrivateTrackedBarcode)
            .fromJSON(JSON.parse(event.argument.trackedBarcode));
          this.overlay.listener.didTapViewForTrackedBarcode(this.overlay, trackedBarcode);
        }
        break;
    }

    return null;
  }

  private initialize() {
    this.subscribeListener();
  }
}
