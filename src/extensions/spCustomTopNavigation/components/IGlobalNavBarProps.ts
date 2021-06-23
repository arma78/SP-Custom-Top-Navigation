import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { SPHttpClient } from '@pnp/sp';

export interface IGlobalNavBarProps {
  context: ApplicationCustomizerContext;
  UrlRootSite: string;
  TopBackground: string;
  FontColor: string;
  MenuITembBgColor: string;
  EmpowerAuthorization: string;
}


