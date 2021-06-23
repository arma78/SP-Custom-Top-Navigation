
import { override } from '@microsoft/decorators';
import { Log, SPEventArgs } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer, PlaceholderContent, PlaceholderName
} from '@microsoft/sp-application-base';
import * as ReactDom from 'react-dom';
import * as strings from 'SpCustomTopNavigationApplicationCustomizerStrings';
import GlobalNavBar from './components/GlobalNavBar';
import {IGlobalNavBarProps} from './components/IGlobalNavBarProps';
import * as React from 'react';
import { sp, SPHttpClient } from '@pnp/sp';
import pnp from 'sp-pnp-js';
const LOG_SOURCE: string = 'SpCustomTopNavigationApplicationCustomizer';
const NAV_TERMS_KEY: string = 'global-navigation-terms';


export interface ISpCustomTopNavigationApplicationCustomizerProperties {
  UrlRootSite: string;
  TopBackground: string;
  FontColor: string;
  MenuITembBgColor: string;
  EmpowerAuthorization: string;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class SpCustomTopNavigationApplicationCustomizer
  extends BaseApplicationCustomizer<ISpCustomTopNavigationApplicationCustomizerProperties> {
    private _headerPlaceholder: PlaceholderContent | undefined;
  @override
  public onInit(): Promise<void> {
    super.onInit();
    sp.setup(this.context);

    // Added to handle possible changes on the existence of placeholders
    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);
    
    this._renderPlaceHolders();
    return Promise.resolve();
  }

  private _renderPlaceHolders(): void {
    // Check if the header placeholder is already set and if the header placeholder is available
    if (!this._headerPlaceholder && this.context.placeholderProvider.placeholderNames.indexOf(PlaceholderName.Top) !== -1) {
      this._headerPlaceholder = this.context.placeholderProvider.tryCreateContent(PlaceholderName.Top, {
        onDispose: this._onDispose
      });
      window.addEventListener('beforeunload', (_e) => {
        this._headerPlaceholder.dispose();
      });

      // The extension should not assume that the expected placeholder is available.
      if (!this._headerPlaceholder) {
        console.error('The expected placeholder (PageHeader) was not found.');
        return;
      }

      if (this._headerPlaceholder.domElement) {
        if (Boolean(this.properties.UrlRootSite) == false) {
          this.properties.UrlRootSite = window.location.origin;
        }
        const element: React.ReactElement<IGlobalNavBarProps> = React.createElement(
          GlobalNavBar,
          {
            context: this.context,
            UrlRootSite: this.properties.UrlRootSite,
            TopBackground: this.properties.TopBackground,
            FontColor: this.properties.FontColor,
            MenuITembBgColor: this.properties.MenuITembBgColor,
            EmpowerAuthorization: this.properties.EmpowerAuthorization,
          }
        );
        ReactDom.render(element, this._headerPlaceholder.domElement);
      }
    }
  }
  private _onDispose(): void {
    this._headerPlaceholder.dispose();
    console.log('Disposed Top Nav.');
  }



}
