import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GraphService } from '../shared/graph.service';
import { CommonService } from '../shared/common.service';
import * as cytoscape from 'cytoscape';
import spread from 'cytoscape-spread';
import fcose from 'cytoscape-fcose';
import cise from 'cytoscape-cise';
import euler from 'cytoscape-euler';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import avsdf from 'cytoscape-avsdf';
declare var $: any;
import * as jslinq from "jslinq";
import { CyMethodsService } from '../shared/cy.methods.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit, OnDestroy {
  @Input() cyIndex: any;
  timelineAttribute: any;
  selected: any;
  labelData: any;

  dataSubscription:Subscription;

  constructor(
    private grphservice: GraphService,
    private _cs: CommonService, private _cys:CyMethodsService) {
    this.grphservice.timelineAttr.subscribe(res => {
      if (res) {
        this.timelineAttribute = res;
        this.initializeTimelineData(this.timelineAttribute);
      }
    })
    this.grphservice.cyIndex.subscribe(res =>this.selected = res);
  }


  ngOnInit(): void {
    this.grphservice.getStyle().subscribe(res => {
      this.grphservice.styleArr = res;
      if (res) this.fetchData();
    });
    this.grphservice.bgImage.subscribe(res => {
      if (res) this.changeBackground(res);
    })
   this.dataSubscription =   this.grphservice.dataArr.subscribe(res => this.graphDataArray = res);
    this._cs.isRestore.subscribe(res=>{
      if(res){      
        this.grphservice.tabs  = [this.grphservice.tabs[0]]
        this.grphservice.cyIndex.next(0);
        this.grphservice.cy[this.selected].scratch();
        this.grphservice.cy[this.selected].add(this.graphDataArray);
      }
    })
  }

ngOnDestroy():void{
  this.dataSubscription.unsubscribe();
}



  /**Init chart when fetch data from server**/
  /* fetchData(){   
    this.grphservice.getData().subscribe(
      res =>{
        this.grphservice.dataArr = res;        
        if(res){
          this.initChart(this.grphservice.dataArr, 0);          
         }
        },
      err => console.log(err)
     )
   }*/

  /**METHOD FOR GET DATA FROM WEB SERVICES**/
  graphDataArray: any = [];
  fetchData() {
    this.grphservice.getLabelData().subscribe(
      res => {
        this.grphservice.labelData =  res["Style"].data;
        this.labelData = res["Style"].data;
      },
      err => console.log(err))
    this.grphservice.getWebData().subscribe(
      res => {
        let dataArray = [];
        let data = res["Output"];       
        if(data["nodes"]) dataArray.push(...data["nodes"]);
        if(data["edges"]) dataArray.push(...data["edges"]);        
        // let dataArray = [...data["nodes"], ...data.edges];       
        this.grphservice.dataArr.next(dataArray);
        if (this.graphDataArray.length) {
          this.initChart(this.graphDataArray, 0);
          if (this.selected == 0) {
            this.grphservice.nodesLabel = [... new Set(this.grphservice.cy[this.selected].elements().filter('node').map(item => item.data().label))]
          }
        }
        if (this.grphservice.cy[this.selected]) {
          data["nodes"].forEach((itemNodes) => {
            if (this.labelData) {
              this.labelData.forEach((itemLabel) => {
                if (itemNodes.data.label == itemLabel.label && itemLabel.icon != "") {
                  this.grphservice.cy[this.selected].$('#' + itemNodes.data.id).style({
                    "background-image": itemLabel.icon,
                    "background-color": itemLabel.bgcolor,
                    "content": itemNodes.data[itemLabel.property]
                  });
                }
              });
            }
          });
        }
      }, err => console.log(err));
  }


  initChart(data, index) {
    cytoscape.use(spread);
    cytoscape.use(fcose);
    cytoscape.use(cise);
    cytoscape.use(euler);
    cytoscape.use(klay);
    cytoscape.use(spread);
    cytoscape.use(dagre);
    cytoscape.use(cola);
    cytoscape.use(coseBilkent);
    cytoscape.use(avsdf);
    let _selector = document.getElementById('cy' + index);
    let  defaultLayout:any = 'fcose'
    console.log('cy' + index);
    if (_selector) {
      this.grphservice.cy[index] = cytoscape({
        container: _selector,
        layout: {
          animate: this.grphservice.layoutAnim,
          prelayout: false,
          name: defaultLayout,
          fit: true,
          animationDuration: 1000
        },
        selectionType: 'additive',
        style: this.grphservice.styleArr,
        elements: data,
        wheelSensitivity: .1
      })
      this.graphMethods();
      // if (this.grphservice.cy[this.selected]) {
        // this.grphservice.cy[this.selected].on('select tap tapunselect tapselect', (e: any) => this._cys.commonUtils(e))
      //   this.grphservice.cy[this.selected].on('select tapunselect', 'node', (e: any) => this.getAllSelectedNode(e))
      //   this.grphservice.cy[this.selected].on('select tapselect', 'edge', (e: any) => this.getAllSelectedEdge(e))
      //   this.grphservice.cy[this.selected].on('mouseover', 'node', (e: any) => this.onMouseOver(e))
      //   this.grphservice.cy[this.selected].on('mouseout', 'node', (e: any) => this.onMouseOut(e));
      //   this.grphservice.cy[this.selected].on('zoom', (e: any) => this.manageZoomEve(e))
      //   this._cs.initNavigator();
      //   this.initContexMenu();
      //   this.hideNavigator();
      // }
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
      this._cs.initNavigator();
      this.initContexMenu();
      this.hideNavigator();
    }
  }

  /**COMMON UTILIESE FOR DETECTING TAP EVENT EITHER NODE OR BACKGROUND**/
  commonUtils(e: any) {    
    let eTarget = e.target;
    if (e.type == 'select' || e.type == 'tapselect') {
      let isExists = this.grphservice.selectedItems.some(item => item?.data.id === e.target.id());
      if (!isExists) this.grphservice.selectedItems.push(e.target.json());
    }
    if (e.type == 'tapunselect') {
      this.grphservice.selectedItems = this.grphservice.selectedItems.filter(item => item.data.id !== e.target.id())
      if (eTarget == this.grphservice.cy[this.selected]) {
        this.grphservice.selectedIds = [];       
      }
    }
    this.grphservice.detectItemSection.next(true);
  }

  /**CHANGE NODES BACKGROUND IMAGE**/
  changeBackground(imageData) {
    this.grphservice.selectedIds.forEach((item) => {
      this.grphservice.cy[this.selected].$('#' + item).style({
        "background-image": imageData,
        "background-opacity": "0"
      });
    })
  }



  getAllSelectedNode(e: any) {
    let selectedNodeItem: any = [];
    if ((e.type == 'select') || (e.type == 'tapselect')) {
      this.grphservice.selectedIds = this.grphservice.cy[this.selected].elements().filter('node').filter(item => item.selected()).map(item => item.id())
      this.grphservice.isSelected = true;
      this.grphservice.cy[this.selected].elements().filter(item => item.selected()).forEach(item => {
        if (item.group() == 'nodes') selectedNodeItem.push(item.json());
      })
      this.initializeNodeData(selectedNodeItem);
    }
  }


  getAllSelectedEdge(e: any) {   
    if ((e.type == 'select') || (e.type == 'tapselect')) {     
      let selectedItem = e.target.source().data();
      this.labelData.forEach((itemLabel) => {
        if (selectedItem.label == itemLabel.label) {
          this.grphservice.nodeDefaultShowProperty = itemLabel.property;
        }
      })
      this.grphservice.sourceNode = selectedItem[this.grphservice.nodeDefaultShowProperty];
      this.labelData.forEach((itemLabel) => {
        if (selectedItem.label == itemLabel.label) {
          this.grphservice.nodeDefaultShowProperty = itemLabel.property;
        }
      })
      this.grphservice.targetNode = selectedItem[this.grphservice.nodeDefaultShowProperty];
    }
  }


  /**HIGHLITE FIRST DEGREE INCOMMING AND OUTGOING NODES**/
  onMouseOver(e) {
    var sel = e.target;
    this.grphservice.cy[this.selected].elements()
      .difference(sel.outgoers().union(sel.incomers())).not(sel).addClass('semitransp');
    sel.addClass('hoverdNode').outgoers().addClass('outgoers');
    sel.addClass('hoverdNode').incomers().addClass('incomers');
  }
  onMouseOut(e) {
    var sel = e.target;
    this.grphservice.cy[this.selected].elements().removeClass('semitransp');
    sel.removeClass('hoverdNode').outgoers().removeClass('outgoers');
    sel.removeClass('hoverdNode').incomers().removeClass('incomers');
  }

  /**FOR ZOOM IN CHART**/
  zoomUnit = 1
  zoomIn() {
    this.zoomUnit = this.zoomUnit + .25
    this.grphservice.cy[this.selected].zoom(this.zoomUnit);
  }
  /**FOR ZOOM OUT CHART**/
  zoomOut() {
    this.zoomUnit = this.zoomUnit - .25
    this.grphservice.cy[this.selected].zoom(this.zoomUnit);
  }
  /**FOR ADD NEW JSON**/
  updateJSON(dataArr) {
    let data = JSON.parse(dataArr);
    console.log(data);
    data.forEach((item) => {
      this.grphservice.cy[this.selected].add(item);
    });
  }


  manageZoomEve(e) {
    let nodes = this.grphservice.cy[this.selected].nodes();
    let newMap = new Map();    
    nodes.forEach((n) => {     
      if ((n.style().backgroundImage !== 'none') && (n.style().backgroundImage !== 'undefined')) {
        this.grphservice.nodeBgImg = n.style().backgroundImage;
        newMap.set(n.id(), n.style().backgroundImage);
      }
      if (this.grphservice.cy[this.selected].zoom() < .8) {
        n.style({
          "background-image": "none",
          "background-opacity": "1"
        })
      } else {
        n.style({
          "background-image": this.grphservice.nodeBgImg,
        })
      }
    })
    // console.log(newMap);
  }



  /**INITIALIZE CONTEXT MENU**/
  initContexMenu() {
    this.grphservice.cy[this.selected].cxtmenu({
      selector: 'node, edge',
      commands: [
        {
          content: '<span class="fa fa-flash fa-2x"></span>',
          select: function (ele) {
            // console.log( ele.id() );
          }
        },
        {
          content: '<span class="fa fa-star fa-2x"></span>',
          select: function (ele) {
            // console.log( ele.data('name') );
          },
          enabled: false
        },
        {
          content: 'Text',
          select: function (ele) {
            //console.log( ele.position() );
          }
        }
      ]
    });
  }

  initializeNodeData(selectedId) {
    if (selectedId.length == 1) {
      this.labelData.forEach((itemLabel) => {
        if (selectedId[0].data.label == itemLabel.label) {
          this.grphservice.nodeDefaultShowProperty = itemLabel.property;
        }
      })

      this.grphservice.nodeLabel = selectedId[0].data.label;
      this.grphservice.selectedNodeVal = selectedId[0].data[this.grphservice.nodeDefaultShowProperty];
      const allOutIncomingNodes: any = []
      let graphItem = this.grphservice.cy[this.selected].$(`#${this.grphservice.selectedIds}`);
      graphItem.outgoers().forEach((item) => {
        allOutIncomingNodes.push(item.json())
      })
      graphItem.incomers().forEach((item) => {
        allOutIncomingNodes.push(item.json())
      })


      this.grphservice.selectedNodesBg = this.grphservice.cy[this.selected].$(`#${selectedId[0].data.id}`).style().backgroundImage


      for (var i = 0; i < allOutIncomingNodes.length - 1; i++) {
        let obj = {};

        obj["relationId"] = allOutIncomingNodes[i].data[this.grphservice.edgeDefaultShowProperty];
        obj["targetId"] = allOutIncomingNodes[i + 1].data[this.grphservice.nodeDefaultShowProperty];
        obj["bgImage"] = this.grphservice.cy[this.selected].$(`#${allOutIncomingNodes[i + 1].data.id}`).style().backgroundImage
        obj["nodeProp"] = this.grphservice.nodeDefaultShowProperty;
        obj["edgeProp"] = this.grphservice.edgeDefaultShowProperty;

        this.grphservice.verTicsDataArr.push(obj);
        i++;
      }

      this.grphservice.nodeAllAtributes = selectedId[0].data;
    }
  }

  /**INITLIZE TIMELINE DATA**/
  initializeTimelineData(attr) {
    if (attr) {
      var nodesArr = this.graphDataArray.filter(item => item.group == 'nodes');
      var queryObj = jslinq(nodesArr);
      var timeLineDataArr: any = [];
      let dateArr: any = queryObj.groupBy(function (el: any) {
        let dd = createTwoDitit(new Date(el.data[attr] * 1000).getDate())
        let mm = createTwoDitit(new Date(el.data[attr] * 1000).getMonth())
        let yy = new Date(el.data[attr] * 1000).getFullYear()
        return `${mm}/${dd}/${yy}`;
      })
      //console.log(dateArr.items);
      dateArr.toList().forEach((itemData) => {
        let obj = {};
        obj["date"] = itemData.key
        obj["count"] = itemData.count;
        timeLineDataArr.push(obj);
      })
      this.grphservice.sliderDataArr.next(timeLineDataArr);
    }
    function createTwoDitit(date) {
      let d;
      if (date < 10) {
        d = '0' + date
      } else {
        d = date
      }
      return d
    }
  }

  hideNavigator() {
    let d: HTMLElement = document.querySelector('.cytoscape-navigator');
    if (d) {
      d.style.opacity = '0.0';
      d.style.zIndex = '-9';
    }
  }

}
