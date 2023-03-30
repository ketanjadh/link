import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {MatProgressBarModule} from '@angular/material/progress-bar'
import {MatTableModule} from '@angular/material/table';
import {MatSidenavModule} from '@angular/material/sidenav'
import {MatButtonModule} from '@angular/material/button'
import {MatToolbarModule} from '@angular/material/toolbar'
import {MatFormFieldModule} from '@angular/material/form-field'
import {MatInputModule} from '@angular/material/input'
import {MatSelectModule} from '@angular/material/select'
import {MatRadioModule} from '@angular/material/radio'
import {MatCheckboxModule} from '@angular/material/checkbox'
import {MatMenuModule} from '@angular/material/menu'
import {MatIconModule} from '@angular/material/icon'
import {MatAutocompleteModule} from '@angular/material/autocomplete'
import {MatDialogModule} from '@angular/material/dialog'
import {MatExpansionModule} from '@angular/material/expansion'
import {MatDividerModule} from '@angular/material/divider'
import {MatSnackBarModule} from '@angular/material/snack-bar'
import {MatTooltipModule} from '@angular/material/tooltip'
import {MatTabsModule} from '@angular/material/tabs';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';



const MaterialComponent = [
  MatProgressBarModule,  
  MatButtonModule, 
  MatSidenavModule,
  MatToolbarModule, 
  MatFormFieldModule,  
  MatInputModule, 
  MatSelectModule,
  MatRadioModule,
  MatCheckboxModule,
  MatTableModule,
  MatMenuModule,
  MatIconModule,
  MatAutocompleteModule,
  MatDialogModule,
  MatExpansionModule,
  MatDividerModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatTabsModule,
  MatSlideToggleModule
]

@NgModule({
  exports: [MaterialComponent],
  imports: [MaterialComponent],
  declarations: [],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ],
})
export class MaterialModule { }
