/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeTrackingListenerProxy"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import {
  BarcodeTrackingListener,
  BarcodeTrackingSession,
  PrivateBarcodeTrackingSession,
} from 'BarcodeTracking+Related';
import { BlockingModeListenerResult } from 'Cordova/CommonCordova';

import { Cordova, CordovaFunction } from './Cordova';

declare type BarcodeTracking = any; // To avoid a circular dependency. BarcodeTracking is only used here as a type

enum BarcodeTrackingListenerEvent {
  DidUpdateSession = 'didUpdateSessionInBarcodeTracking',
}

interface ListenerEvent {
  name: BarcodeTrackingListenerEvent;
  argument: any;
  shouldNotifyWhenFinished: boolean;
}

export class BarcodeTrackingListenerProxy {
  private static cordovaExec = Cordova.exec;
  private barcodeTracking: BarcodeTracking;

  public static forBarcodeTracking(barcodeTracking: BarcodeTracking): BarcodeTrackingListenerProxy {
    const proxy = new BarcodeTrackingListenerProxy();
    proxy.barcodeTracking = barcodeTracking;
    proxy.initialize();
    return proxy;
  }

  private initialize() {
    this.subscribeListener();
  }

  private subscribeListener() {
    BarcodeTrackingListenerProxy.cordovaExec(
      this.notifyListeners.bind(this),
      null,
      CordovaFunction.SubscribeBarcodeTrackingListener,
      null,
    );
  }

  private notifyListeners(event: ListenerEvent): BlockingModeListenerResult {
    const done = () => {
      this.barcodeTracking.isInListenerCallback = false;
      return { enabled: this.barcodeTracking.isEnabled };
    };

    this.barcodeTracking.isInListenerCallback = true;

    if (!event) {
      // The event could be undefined/null in case the plugin result did not pass a "message",
      // which could happen e.g. in case of "ok" results, which could signal e.g. successful
      // listener subscriptions.
      return done();
    }

    (this.barcodeTracking as any).listeners.forEach((listener: BarcodeTrackingListener) => {
      switch (event.name) {
        case BarcodeTrackingListenerEvent.DidUpdateSession:
          if (listener.didUpdateSession) {
            listener.didUpdateSession(
              this.barcodeTracking,
              (BarcodeTrackingSession as any as PrivateBarcodeTrackingSession)
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
