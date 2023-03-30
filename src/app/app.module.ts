import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import { MaterialModule } from '../app/shared/material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { GraphComponent } from './graph/graph.component';
import { NavigationUiComponent } from './navigation-ui/navigation-ui.component';
import { NodeEdgeRuleComponent } from './node-edge-rule/node-edge-rule.component';
import { DefaultComponent } from './default/default.component';
//import * as PlotlyJS from 'plotly.js/dist/plotly.js';


 import { PlotlyModule } from 'angular-plotly.js';
import { RangeSliderComponent } from './range-slider/range-slider.component';
import { IconViewerComponent } from './icon-viewer/icon-viewer.component';
 import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RightTabsNavComponent } from './right-tabs-nav/right-tabs-nav.component';
import { DailogDataComponent } from './dailog-data/dailog-data.component';
//PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
  declarations: [
    AppComponent,
    //DefaultComponent,
   // GraphComponent,
    //NavigationUiComponent,
   // NodeEdgeRuleComponent,
    //RightTabsNavComponent,
   // RangeSliderComponent,
    //IconViewerComponent,
   //DailogDataComponent


  ],
  imports: [
    BrowserModule,
    //NgxMatColorPickerModule,
    AppRoutingModule,
    MaterialModule,
    FormsModule, ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    //PlotlyModule,
    //MatProgressBarModule
  ],
  providers: [
    //{ provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
