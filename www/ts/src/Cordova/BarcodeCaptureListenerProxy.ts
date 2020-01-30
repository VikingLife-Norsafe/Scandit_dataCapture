/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeCaptureListenerProxy"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { BarcodeCaptureListener, BarcodeCaptureSession, PrivateBarcodeCaptureSession } from 'BarcodeCapture+Related';
import { BlockingModeListenerResult } from 'Cordova/CommonCordova';

import { Cordova, CordovaFunction } from './Cordova';

declare type BarcodeCapture = any; // To avoid a circular dependency. BarcodeCapture is only used here as a type

enum BarcodeCaptureListenerEvent {
  DidScan = 'didScanInBarcodeCapture',
  DidUpdateSession = 'didUpdateSessionInBarcodeCapture',
}

interface ListenerEvent {
  name: BarcodeCaptureListenerEvent;
  argument: any;
  shouldNotifyWhenFinished: boolean;
}

export class BarcodeCaptureListenerProxy {
  private static cordovaExec = Cordova.exec;
  private barcodeCapture: BarcodeCapture;

  public static forBarcodeCapture(barcodeCapture: BarcodeCapture): BarcodeCaptureListenerProxy {
    const proxy = new BarcodeCaptureListenerProxy();
    proxy.barcodeCapture = barcodeCapture;
    proxy.initialize();
    return proxy;
  }

  private initialize() {
    this.subscribeListener();
  }

  private subscribeListener() {
    BarcodeCaptureListenerProxy.cordovaExec(
      this.notifyListeners.bind(this),
      null,
      CordovaFunction.SubscribeBarcodeCaptureListener,
      null,
    );
  }

  private notifyListeners(event: ListenerEvent): BlockingModeListenerResult {
    const done = () => {
      this.barcodeCapture.isInListenerCallback = false;
      return { enabled: this.barcodeCapture.isEnabled };
    };

    this.barcodeCapture.isInListenerCallback = true;

    if (!event) {
      // The event could be undefined/null in case the plugin result did not pass a "message",
      // which could happen e.g. in case of "ok" results, which could signal e.g. successful
      // listener subscriptions.
      return done();
    }

    (this.barcodeCapture as any).listeners.forEach((listener: BarcodeCaptureListener) => {
      switch (event.name) {
        case BarcodeCaptureListenerEvent.DidScan:
          if (listener.didScan) {
            listener.didScan(
              this.barcodeCapture,
              (BarcodeCaptureSession as any as PrivateBarcodeCaptureSession)
                .fromJSON(JSON.parse(event.argument.session)),

              // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
              // (FrameData as any).fromJSON(event.argument.frameData),
            );
          }
          break;

        case BarcodeCaptureListenerEvent.DidUpdateSession:
          if (listener.didUpdateSession) {
            listener.didUpdateSession(
              this.barcodeCapture,
              (BarcodeCaptureSession as any as PrivateBarcodeCaptureSession)
                .fromJSON(JSON.parse(event.argument.session)),

              // TODO: adjust when readding framedata to the api https://jira.scandit.com/browse/SDC-1159
              // (FrameData as any).fromJSON(event.argument.frameData),
            );
          }
          break;
      }
    });

    return done();
  }
}
