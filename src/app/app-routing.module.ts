import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DefaultComponent } from './default/default.component';
import { RangeSliderComponent } from './range-slider/range-slider.component';
import { GraphService } from './shared/graph.service';



const routes: Routes = [
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: "default", component: DefaultComponent },
  { path: "range-slider", component: RangeSliderComponent },
  { path: "graph", component: GraphService }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
