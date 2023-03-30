import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../shared/common.service';
import { GraphService } from '../shared/graph.service';
import * as cytoscape from 'cytoscape';
import cxtmenu from 'cytoscape-cxtmenu';
cytoscape.use(cxtmenu);
import jquery from 'jquery';
import graphml from 'cytoscape-graphml';
import { MatDialog } from '@angular/material/dialog';
import { GraphComponent } from '../graph/graph.component';
import { CyMethodsService } from '../shared/cy.methods.service';
graphml(cytoscape, jquery);
declare var $: any;

@Component({
  selector: 'app-default',
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements  OnInit {
  selected:number=0;
  constructor(public grphservice: GraphService, private _cs:CommonService,
    private _cys:CyMethodsService, private dialog:MatDialog) {
    this.grphservice.cyIndex.subscribe(res =>this.selected = res);
    this.grphservice.isSubgraphReady.subscribe(res=>{
      if(res){
        // this.grphservice.cy[this.selected].mount();
      }
    })
  }

  ngOnInit():void{   
}



  /**CUT COPY PASTE FUNCTIONALITY FOR GRAPH***/
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'x') this._cs.Cut();
    if (event.ctrlKey && event.key === 'c') this._cs.Copy()
    if (event.ctrlKey && event.key === 'v') this._cs.Paste();
  }

  Cut() {
    this.grphservice.clipDataArr = [];
    let dd = this.grphservice.cy[this.selected].$(':selected');
    console.log(dd);
    dd.forEach(item => {
      this.grphservice.clipDataArr.push(item.json());
    })
    dd.forEach(item => {
      this.grphservice.cy[this.selected].$('#' + item.id()).remove()
    })
  }

  Copy() {
    this.grphservice.clipDataArr = [];
    let dd = this.grphservice.cy[this.selected].$(':selected');
    dd.forEach(item => {
      this.grphservice.clipDataArr.push(item.json())
    })
  }

  Paste() {
   let mydata = this.grphservice.clipDataArr;
    if(this.grphservice.cy[this.selected]){
    mydata.forEach((item) => {
      this.grphservice.cy[this.selected].add(item);
      this.grphservice.cy[this.selected].$('#' + item).deselect();
    });
    this.grphservice.cy[this.selected].fit();
  }
  }

/**ADD REMOVE AND SELECTED TABS FOR GRAPH**/
  tabIndex:any = 0;
  subgraphIndex:number=0;
  isNewTabAdded:boolean = false;
  addTab() { 
    this.tabIndex = this.selected;  
    this.isNewTabAdded   = true;
    this.subgraphIndex++   
    this.tabIndex = Math.max(0, this.grphservice.tabs.length);  
    this.grphservice.selectedGraphId += 1; 
    this.grphservice.cyIndex.next(this.tabIndex);    
    this.grphservice.tabs.push('Subgraph - ' + this.subgraphIndex);   
    setTimeout(() => {
      this.newChart(this.tabIndex);
      this.grphservice.cy[this.tabIndex].scratch();              
    }, 1000);  
  }



  showRequestedChart(e) {     
  if(!this.isNewTabAdded) this.grphservice.cyIndex.next(e);
  setTimeout(()=>{ 
       if(this.grphservice.isResetgraph){
        this._cs.changeLayout(this.grphservice.defaultLayout);      
       }        
      this.grphservice.cy[this.selected].fit();
      this.isNewTabAdded = false;
      this.grphservice.selectedItems = [];
      this.graphMethods();
    },1000)   
   console.log(e); 
  }


  removeTab(index: number) {
    console.log(index);
    this.grphservice.tabs.splice(index, 1);
    this.grphservice.cyIndex.next(this.selected - 1);
  }



  newChart(index) {
    let _selector = document.getElementById('cy' + index);
    if(_selector){
    this.grphservice.cy[index] = cytoscape({
      container:_selector,
      layout: {
        name: this.grphservice.layoutName,
        animate: this.grphservice.layoutAnim,
        fit: true
      },
      style: this.grphservice.styleArr
    })    
   }
  }


  graphMethods(){    
    if (this.grphservice.cy[this.selected]) {
      this.grphservice.cy[this.selected].on('select tap tapunselect tapselect', (e: any) => this._cys.commonUtils(e))
      this.grphservice.cy[this.selected].on('select tapunselect', 'node', (e: any) => this._cys.getAllSelectedNode(e))
      this.grphservice.cy[this.selected].on('select tapselect', 'edge', (e: any) => this._cys.getAllSelectedEdge(e))
      this.grphservice.cy[this.selected].on('mouseover', 'node', (e: any) => this._cys.onMouseOver(e))
      this.grphservice.cy[this.selected].on('mouseout', 'node', (e: any) => this._cys.onMouseOut(e));
      this.grphservice.cy[this.selected].on('zoom', (e: any) => this._cys.manageZoomEve(e))     
    }
  }


 

}
