/// <amd-module name="scandit-cordova-datacapture-barcode.Barcode"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { PrivateQuadrilateral, Quadrilateral, QuadrilateralJSON } from 'Common';
import { DefaultSerializeable, ignoreFromSerialization, nameForSerialization } from 'Serializeable';

export enum Symbology {
  EAN13UPCA = 'ean13Upca',
  UPCE = 'upce',
  EAN8 = 'ean8',
  Code39 = 'code39',
  Code93 = 'code93',
  Code128 = 'code128',
  Code11 = 'code11',
  Code25 = 'code25',
  Codabar = 'codabar',
  InterleavedTwoOfFive = 'interleavedTwoOfFive',
  MSIPlessey = 'msiPlessey',
  QR = 'qr',
  DataMatrix = 'dataMatrix',
  Aztec = 'aztec',
  MaxiCode = 'maxicode',
  DotCode = 'dotcode',
  KIX = 'kix',
  RM4SCC = 'rm4scc',
  GS1Databar = 'databar',
  GS1DatabarExpanded = 'databarExpanded',
  GS1DatabarLimited = 'databarLimited',
  PDF417 = 'pdf417',
  MicroPDF417 = 'microPdf417',
  MicroQR = 'microQr',
  Code32 = 'code32',
  Lapa4SC = 'lapa4sc',
  IATATwoOfFive = 'iata2of5',
}

export interface PrivateSymbologyDescription {
  defaults: () => { SymbologyDescriptions: SymbologyDescription[] };
  fromJSON(json: SymbologyDescriptionJSON): SymbologyDescription;
}

export class SymbologyDescription {
  // Implemented in Defaults.ts to avoid circular dependency
  private static defaults: () => { SymbologyDescriptions: SymbologyDescription[] };

  public static get all(): SymbologyDescription[] {
    return this.defaults().SymbologyDescriptions;
  }

  private _identifier: string;
  public get identifier(): string { return this._identifier; }
  public get symbology(): Symbology { return this.identifier as Symbology; }

  private _readableName: string;
  public get readableName(): string { return this._readableName; }

  private _isAvailable: boolean;
  public get isAvailable(): boolean { return this._isAvailable; }

  private _isColorInvertible: boolean;
  public get isColorInvertible(): boolean { return this._isColorInvertible; }

  private _activeSymbolCountRange: Range;
  public get activeSymbolCountRange(): Range { return this._activeSymbolCountRange; }

  private _defaultSymbolCountRange: Range;
  public get defaultSymbolCountRange(): Range { return this._defaultSymbolCountRange; }

  private _supportedExtensions: string[];
  public get supportedExtensions(): string[] { return this._supportedExtensions; }

  private static fromJSON(json: SymbologyDescriptionJSON): SymbologyDescription {
    const symbologyDescription = new SymbologyDescription();

    symbologyDescription._identifier = json.identifier;
    symbologyDescription._readableName = json.readableName;
    symbologyDescription._isAvailable = json.isAvailable;
    symbologyDescription._isColorInvertible = json.isColorInvertible;
    symbologyDescription._activeSymbolCountRange = (Range as any).fromJSON(json.activeSymbolCountRange);
    symbologyDescription._defaultSymbolCountRange = (Range as any).fromJSON(json.defaultSymbolCountRange);
    symbologyDescription._supportedExtensions = json.supportedExtensions;

    return symbologyDescription;
  }

  public static forIdentifier(identifier: string): SymbologyDescription {
    return new SymbologyDescription(identifier as Symbology);
  }

  public constructor(symbology: Symbology)
  constructor()
  constructor(symbology?: Symbology) {
    if (!symbology) {
      return;
    }
    return SymbologyDescription.all[SymbologyDescription.all
      .findIndex(description => description.identifier === symbology)];
  }
}

export interface PrivateSymbologySettings {
  fromJSON: (json: any) => SymbologySettings;
  _symbology: Symbology;
}

export class SymbologySettings extends DefaultSerializeable {
  @ignoreFromSerialization
  private _symbology: Symbology;
  private extensions: string[];

  @nameForSerialization('enabled')
  public isEnabled: boolean;
  @nameForSerialization('colorInvertedEnabled')
  public isColorInvertedEnabled: boolean;
  public checksums: Checksum[];
  public activeSymbolCounts: number[];

  public get symbology(): Symbology {
    return this._symbology;
  }

  public get enabledExtensions(): string[] {
    return this.extensions;
  }

  private static fromJSON(json: SymbologySettingsJSON): SymbologySettings {
    const symbologySettings = new SymbologySettings();

    symbologySettings.extensions = json.extensions;
    symbologySettings.isEnabled = json.enabled;
    symbologySettings.isColorInvertedEnabled = json.colorInvertedEnabled;
    symbologySettings.checksums = json.checksums as Checksum[];
    symbologySettings.activeSymbolCounts = json.activeSymbolCounts;

    return symbologySettings;
  }

  public setExtensionEnabled(extension: string, enabled: boolean): void {
    const included = this.extensions.includes(extension);
    if (enabled && !included) {
      this.extensions.push(extension);
    } else if (!enabled && included) {
      this.extensions.splice(this.extensions.indexOf(extension), 1);
    }
  }
}

export enum Checksum {
  Mod10 = 'mod10',
  Mod11 = 'mod11',
  Mod16 = 'mod16',
  Mod43 = 'mod43',
  Mod47 = 'mod47',
  Mod103 = 'mod103',
  Mod10AndMod11 = 'mod1110',
  Mod10AndMod10 = 'mod1010',
}

interface PrivateEncodingRange {
  fromJSON(json: any): EncodingRange;
}

interface EncodingRangeJSON {
  ianaName: string;
  startIndex: number;
  endIndex: number;
}

export class EncodingRange {
  private _ianaName: string;
  public get ianaName(): string { return this._ianaName; }

  private _startIndex: number;
  public get startIndex(): number { return this._startIndex; }

  private _endIndex: number;
  public get endIndex(): number { return this._endIndex; }

  private static fromJSON(json: any): EncodingRange {
    const encodingRange = new EncodingRange();

    encodingRange._ianaName = json.ianaName;
    encodingRange._startIndex = json.startIndex;
    encodingRange._endIndex = json.endIndex;

    return encodingRange;
  }
}

export enum CompositeFlag {
  None = 'none',
  Unknown = 'unknown',
  Linked = 'linked',
  GS1TypeA = 'gs1TypeA',
  GS1TypeB = 'gs1TypeB',
  GS1TypeC = 'gs1TypeC',
}

export interface PrivateRange {
  _minimum: number;
  _maximum: number;
  _step: number;
}

export class Range {
  @nameForSerialization('minimum')
  private _minimum: number;
  @nameForSerialization('maximum')
  private _maximum: number;
  @nameForSerialization('step')
  private _step: number;

  public get minimum(): number {
    return this._minimum;
  }

  public get maximum(): number {
    return this._maximum;
  }

  public get step(): number {
    return this._step;
  }

  public get isFixed(): boolean {
    return this.minimum === this.maximum || this.step <= 0;
  }

  private static fromJSON(json: RangeJSON): Range {
    const range = new Range();

    range._minimum = json.minimum;
    range._maximum = json.maximum;
    range._step = json.step;

    return range;
  }
}

export class Barcode {
  private _symbology: Symbology;
  public get symbology(): Symbology { return this._symbology; }

  private _data: Optional<string>;
  public get data(): Optional<string> { return this._data; }

  private _rawData: string;
  public get rawData(): string { return this._rawData; }

  private _encodingRanges: EncodingRange[];
  public get encodingRanges(): EncodingRange[] { return this._encodingRanges; }

  private _location: Quadrilateral;
  public get location(): Quadrilateral { return this._location; }

  private _isGS1DataCarrier: boolean;
  public get isGS1DataCarrier(): boolean { return this._isGS1DataCarrier; }

  private _compositeFlag: CompositeFlag;
  public get compositeFlag(): CompositeFlag { return this._compositeFlag; }

  private _isColorInverted: boolean;
  public get isColorInverted(): boolean { return this._isColorInverted; }

  private _symbolCount: number;
  public get symbolCount(): number { return this._symbolCount; }

  private _frameID: number;
  public get frameID(): number { return this._frameID; }

  private static fromJSON(json: BarcodeJSON): Barcode {
    const barcode = new Barcode();

    barcode._symbology = json.symbology as Symbology;
    barcode._data = json.data;
    barcode._rawData = json.rawData;
    barcode._isGS1DataCarrier = json.isGS1DataCarrier;
    barcode._compositeFlag = json.compositeFlag as CompositeFlag;
    barcode._isColorInverted = json.isColorInverted;
    barcode._symbolCount = json.symbolCount;
    barcode._frameID = json.frameId;
    if (json.encodingRanges) {
      barcode._encodingRanges = json.encodingRanges.map((EncodingRange as any as PrivateEncodingRange).fromJSON);
    }
    if (json.location) {
      barcode._location = (Quadrilateral as any as PrivateQuadrilateral).fromJSON(json.location);
    }

    return barcode;
  }
}

export interface BarcodeJSON {
  symbology: string;
  data: Optional<string>;
  rawData: string;
  isGS1DataCarrier: boolean;
  compositeFlag: string;
  isColorInverted: boolean;
  symbolCount: number;
  frameId: number;
  encodingRanges: EncodingRangeJSON[];
  location: QuadrilateralJSON;
}

export interface PrivateBarcode {
  fromJSON(json: BarcodeJSON): Barcode;
}

export class LocalizedOnlyBarcode {
  private _location: Quadrilateral;
  private _frameID: number;

  public get location(): Quadrilateral {
    return this._location;
  }

  public get frameID(): number {
    return this._frameID;
  }

  private static fromJSON(json: LocalizedOnlyBarcodeJSON): LocalizedOnlyBarcode {
    const localizedBarcode = new LocalizedOnlyBarcode();

    localizedBarcode._location = (Quadrilateral as any as PrivateQuadrilateral).fromJSON(json.location);
    localizedBarcode._frameID = json.frameId;

    return localizedBarcode;
  }
}

export interface LocalizedOnlyBarcodeJSON {
  location: QuadrilateralJSON;
  frameId: number;
}

export interface PrivateLocalizedOnlyBarcode {
  fromJSON(json: LocalizedOnlyBarcodeJSON): LocalizedOnlyBarcode;
}

export interface TrackedBarcodeJSON {
  deltaTime: number;
  identifier: number;
  shouldAnimateFromPreviousToNextState: boolean;
  barcode: BarcodeJSON;
  predictedLocation: QuadrilateralJSON;
}

export interface PrivateTrackedBarcode {
  sessionFrameSequenceID: Optional<string>;
  fromJSON(json: TrackedBarcodeJSON): TrackedBarcode;
}

export class TrackedBarcode {
  private _deltaTime: number;
  public get deltaTime(): number { return this._deltaTime; }

  private _barcode: Barcode;
  public get barcode(): Barcode { return this._barcode; }

  private _predictedLocation: Quadrilateral;
  public get predictedLocation(): Quadrilateral { return this._predictedLocation; }

  private _identifier: number;
  public get identifier(): number { return this._identifier; }

  private sessionFrameSequenceID: Optional<string>;

  private _shouldAnimateFromPreviousToNextState: boolean;
  public get shouldAnimateFromPreviousToNextState(): boolean { return this._shouldAnimateFromPreviousToNextState; }

  private static fromJSON(json: TrackedBarcodeJSON): TrackedBarcode {
    const trackedBarcode = new TrackedBarcode();

    trackedBarcode._deltaTime = json.deltaTime;
    trackedBarcode._identifier = json.identifier;
    trackedBarcode._shouldAnimateFromPreviousToNextState = json.shouldAnimateFromPreviousToNextState;
    trackedBarcode._barcode = (Barcode as any as PrivateBarcode).fromJSON(json.barcode);
    trackedBarcode._predictedLocation = (Quadrilateral as any as PrivateQuadrilateral).fromJSON(json.predictedLocation);

    return trackedBarcode;
  }
}
