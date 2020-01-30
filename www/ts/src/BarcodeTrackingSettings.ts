/// <amd-module name="scandit-cordova-datacapture-barcode.BarcodeTrackingSettings"/>
// ^ needed because Cordova can't resolve "../xx" style dependencies
import { PrivateSymbologySettings, Symbology, SymbologySettings } from 'Barcode';
import { Cordova } from 'Cordova/Cordova';
import { DefaultSerializeable } from 'Serializeable';

export class BarcodeTrackingSettings extends DefaultSerializeable {
  private properties = {} as { [key: string]: any };

  private symbologies = {} as { [key: string]: SymbologySettings };

  public get enabledSymbologies(): Symbology[] {
    return (Object.keys(this.symbologies) as Symbology[])
      .filter(symbology => this.symbologies[symbology].isEnabled);
  }

  public constructor() {
    super();
  }

  public settingsForSymbology(symbology: Symbology): SymbologySettings {
    if (!this.symbologies[symbology]) {
      const symbologySettings = Cordova.defaults.SymbologySettings[symbology];
      (symbologySettings as any as PrivateSymbologySettings)._symbology = symbology;
      this.symbologies[symbology] = symbologySettings;
    }
    return this.symbologies[symbology];
  }

  public setProperty(name: string, value: any): void {
    this.properties[name] = value;
  }

  public getProperty(name: string): any {
    return this.properties[name];
  }

  public enableSymbologies(symbologies: Symbology[]): void {
    symbologies.forEach(symbology => this.enableSymbology(symbology, true));
  }

  public enableSymbology(symbology: Symbology, enabled: boolean): void {
    this.settingsForSymbology(symbology).isEnabled = enabled;
  }
}
