/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeTrackingBasicOverlayProxy"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { PrivateTrackedBarcode, TrackedBarcode } from 'Barcode';
import { BarcodeTrackingBasicOverlay } from 'BarcodeTracking+Related';
import { Serializeable } from 'Serializeable';
import { Brush } from 'Viewfinder';

import { Cordova, CordovaFunction } from './Cordova';

enum BarcodeTrackingBasicOverlayListenerEvent {
  BrushForTrackedBarcode = 'brushForTrackedBarcode',
  DidTapTrackedBarcode = 'didTapTrackedBarcode',
}

interface BlockingBarcodeTrackingBasicOverlayResult {
  brush: Optional<String>;
}

export class BarcodeTrackingBasicOverlayProxy {
  private static cordovaExec = Cordova.exec;
  private overlay: BarcodeTrackingBasicOverlay;

  public static forOverlay(overlay: BarcodeTrackingBasicOverlay): BarcodeTrackingBasicOverlayProxy {
    const proxy = new BarcodeTrackingBasicOverlayProxy();
    proxy.overlay = overlay;
    proxy.initialize();
    return proxy;
  }

  public setBrushForTrackedBarcode(brush: Brush, trackedBarcode: TrackedBarcode): Promise<void> {
    return new Promise((resolve, reject) => {
      BarcodeTrackingBasicOverlayProxy.cordovaExec(
        null,
        null,
        CordovaFunction.SetBrushForTrackedBarcode,
        [{
          brush: brush ? JSON.stringify((brush as any as Serializeable).toJSON()) : null,
          sessionFrameSequenceID: (trackedBarcode as any as PrivateTrackedBarcode).sessionFrameSequenceID,
          trackedBarcodeID: trackedBarcode.identifier,
        }],
      );
    });
  }

  public clearTrackedBarcodeBrushes(): Promise<void> {
    return new Promise((resolve, reject) => {
      BarcodeTrackingBasicOverlayProxy.cordovaExec(
        resolve,
        reject,
        CordovaFunction.ClearTrackedBarcodeBrushes,
        null,
      );
    });
  }

  private subscribeListener() {
    BarcodeTrackingBasicOverlayProxy.cordovaExec(
      this.notifyListeners.bind(this),
      null,
      CordovaFunction.SubscribeBarcodeTrackingBasicOverlayListener,
      null,
    );
  }

  private notifyListeners(
    event: {
      name: BarcodeTrackingBasicOverlayListenerEvent,
      argument: any,
    }): Optional<BlockingBarcodeTrackingBasicOverlayResult> {
    if (!event || !this.overlay.listener) {
      // The event could be undefined/null in case the plugin result did not pass a "message",
      // which could happen e.g. in case of "ok" results, which could signal e.g. successful
      // listener subscriptions.
      return null;
    }

    switch (event.name) {
      case BarcodeTrackingBasicOverlayListenerEvent.BrushForTrackedBarcode:
        if (this.overlay.listener.brushForTrackedBarcode) {
          const trackedBarcode = (TrackedBarcode as any as PrivateTrackedBarcode)
            .fromJSON(JSON.parse(event.argument.trackedBarcode));
          const brush = this.overlay.listener.brushForTrackedBarcode(this.overlay, trackedBarcode);
          return { brush: brush ? JSON.stringify(brush.toJSON()) : null };
        }
        break;

      case BarcodeTrackingBasicOverlayListenerEvent.DidTapTrackedBarcode:
        if (this.overlay.listener.didTapTrackedBarcode) {
          const trackedBarcode = (TrackedBarcode as any as PrivateTrackedBarcode)
            .fromJSON(JSON.parse(event.argument.trackedBarcode));
          this.overlay.listener.didTapTrackedBarcode(this.overlay, trackedBarcode);
        }
        break;
    }

    return null;
  }

  private initialize() {
    this.subscribeListener();
  }
}
