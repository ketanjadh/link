import { Injectable } from '@angular/core';
import { GraphService } from './graph.service';

@Injectable({
  providedIn: 'root'
})
export class CyMethodsService {
  selected: any = 0;
  constructor(private _gs: GraphService) {
    this._gs.cyIndex.subscribe(res => this.selected = res);
  }

  /**COMMON UTILIESE FOR DETECTING TAP EVENT EITHER NODE OR BACKGROUND**/
  commonUtils(e: any) {
    console.log(e.type);
    let eTarget = e.target;
    if (e.type == 'select' || e.type == 'tapselect') {
      let isExists = this._gs.selectedItems.some(item => item?.data.id === e.target.id());
      if (!isExists) this._gs.selectedItems.push(e.target.json());
    }
    if (e.type == 'tapunselect') {
      this._gs.selectedItems = this._gs.selectedItems.filter(item => item.data.id !== e.target.id())
      if (eTarget == this._gs.cy[this.selected]) {
        this._gs.selectedIds = [];
      }
    }
    this._gs.detectItemSection.next(true);
  }

  /**GET ALL SELECTED NODE**/
  getAllSelectedNode(e: any) {
    let selectedNodeItem: any = [];
    if ((e.type == 'select') || (e.type == 'tapselect')) {
      this._gs.selectedIds = this._gs.cy[this.selected].elements().filter('node').filter(item => item.selected()).map(item => item.id())
      this._gs.isSelected = true;
      this._gs.cy[this.selected].elements().filter(item => item.selected()).forEach(item => {
        if (item.group() == 'nodes') selectedNodeItem.push(item.json());
      })
      this.initializeNodeData(selectedNodeItem);
    }
  }

  /**GET ALL SELECTED EDGES**/
  getAllSelectedEdge(e: any) {
    if ((e.type == 'select') || (e.type == 'tapselect')) {
      let selectedItem = e.target.source().data();
      this._gs.labelData.forEach((itemLabel) => {
        if (selectedItem.label == itemLabel.label) {
          this._gs.nodeDefaultShowProperty = itemLabel.property;
        }
      })
      this._gs.sourceNode = selectedItem[this._gs.nodeDefaultShowProperty];
      this._gs.labelData.forEach((itemLabel) => {
        if (selectedItem.label == itemLabel.label) {
          this._gs.nodeDefaultShowProperty = itemLabel.property;
        }
      })
      this._gs.targetNode = selectedItem[this._gs.nodeDefaultShowProperty];
    }
  }

  /**HIGHLITE FIRST DEGREE INCOMMING AND OUTGOING NODES**/
  onMouseOver(e) {
    var sel = e.target;
    this._gs.cy[this.selected].elements()
      .difference(sel.outgoers().union(sel.incomers())).not(sel).addClass('semitransp');
    sel.addClass('hoverdNode').outgoers().addClass('outgoers');
    sel.addClass('hoverdNode').incomers().addClass('incomers');
  }
  onMouseOut(e) {
    var sel = e.target;
    this._gs.cy[this.selected].elements().removeClass('semitransp');
    sel.removeClass('hoverdNode').outgoers().removeClass('outgoers');
    sel.removeClass('hoverdNode').incomers().removeClass('incomers');
  }

  /**MANAGE GRAPH ZOOM IN/OUT EVENT**/
  manageZoomEve(e) {
    let nodes = this._gs.cy[this.selected].nodes();
    let newMap = new Map();    
    nodes.forEach((n) => {     
      if ((n.style().backgroundImage !== 'none') && (n.style().backgroundImage !== 'undefined')) {
        this._gs.nodeBgImg = n.style().backgroundImage;
        newMap.set(n.id(), n.style().backgroundImage);
      }
      if (this._gs.cy[this.selected].zoom() < .8) {
        n.style({
          "background-image": "none",
          "background-opacity": "1"
        })
      } else {
        n.style({
          "background-image": this._gs.nodeBgImg,
        })
      }
    })  
  }

/**INITIALIZE NODE DATA**/
  initializeNodeData(selectedId) {
    if (selectedId.length == 1) {
      this._gs.labelData.forEach((itemLabel) => {
        if (selectedId[0].data.label == itemLabel.label) {
          this._gs.nodeDefaultShowProperty = itemLabel.property;
        }
      })
      this._gs.nodeLabel = selectedId[0].data.label;
      this._gs.selectedNodeVal = selectedId[0].data[this._gs.nodeDefaultShowProperty];
      const allOutIncomingNodes: any = []
      let graphItem = this._gs.cy[this.selected].$(`#${this._gs.selectedIds}`);
      graphItem.outgoers().forEach((item) => {
        allOutIncomingNodes.push(item.json())
      })
      graphItem.incomers().forEach((item) => {
        allOutIncomingNodes.push(item.json())
      })
      this._gs.selectedNodesBg = this._gs.cy[this.selected].$(`#${selectedId[0].data.id}`).style().backgroundImage
      for (var i = 0; i < allOutIncomingNodes.length - 1; i++) {
        let obj = {};
        obj["relationId"] = allOutIncomingNodes[i].data[this._gs.edgeDefaultShowProperty];
        obj["targetId"] = allOutIncomingNodes[i + 1].data[this._gs.nodeDefaultShowProperty];
        obj["bgImage"] = this._gs.cy[this.selected].$(`#${allOutIncomingNodes[i + 1].data.id}`).style().backgroundImage
        obj["nodeProp"] = this._gs.nodeDefaultShowProperty;
        obj["edgeProp"] = this._gs.edgeDefaultShowProperty;
        this._gs.verTicsDataArr.push(obj);
        i++;
      }
      this._gs.nodeAllAtributes = selectedId[0].data;
    }
  }

}
