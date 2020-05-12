/// <amd-module name="scandit-cordova-datacapture-barcode.TrackedBarcodeView"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { Size } from 'Common';
import { DefaultSerializeable } from 'Serializeable';

export interface PrivateTrackedBarcodeView {
  data: string;
  toJSON(): string;
  getEncodedImageData(element: HTMLElement): string;
}

interface SVGData {
  data: string;
  size: Size;
}

export interface TrackedBarcodeViewOptions {
  size?: Size;
  scale?: number;
}

export class TrackedBarcodeView extends DefaultSerializeable {
  private data: string;
  private options: TrackedBarcodeViewOptions;

  public static withHTMLElement(
    element: HTMLElement, options: Optional<TrackedBarcodeViewOptions>): Promise<TrackedBarcodeView> {
    return this.getEncodedImageData(element).then(data => new TrackedBarcodeView(data, options));
  }

  public static withBase64EncodedData(
    data: string, options: Optional<TrackedBarcodeViewOptions>): Promise<TrackedBarcodeView> {
    return Promise.resolve(new TrackedBarcodeView(data, options));
  }

  private static getEncodedImageData(element: HTMLElement): Promise<string> {
    return this.getBase64DataForSVG(this.getSVGDataForElement(element));
  }

  private static getSize(element: HTMLElement): Size {
    const isInDOM = document.body.contains(element);

    if (!isInDOM) {
      document.body.appendChild(element);
    }

    const size = element.getBoundingClientRect();

    if (!isInDOM) {
      document.body.removeChild(element);
    }

    return new Size(size.width, size.height);
  }

  private static getSVGDataForElement(element: HTMLElement): SVGData {
    const size = this.getSize(element);
    const data = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}px" height="${size.height}px">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${element.outerHTML}
          </div>
        </foreignObject>
      </svg>`);

    return { data, size };
  }

  private static getCanvasWithSize(size: { width: number, height: number }): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    return canvas;
  }

  private static getBase64DataForSVG(svgData: SVGData): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const canvas = this.getCanvasWithSize(svgData.size);
        canvas.getContext('2d')!.drawImage(image, 0, 0);
        resolve(canvas.toDataURL('image/png', 1));
      };

      image.onerror = reject;

      image.src = 'data:image/svg+xml,' + svgData.data;
    });
  }

  private constructor(encodedData: string, options: Optional<TrackedBarcodeViewOptions>) {
    super();

    if (options == null) {
      options = { scale: 1 } as TrackedBarcodeViewOptions;
    }

    this.data = encodedData;
    this.options = options;
  }
}
