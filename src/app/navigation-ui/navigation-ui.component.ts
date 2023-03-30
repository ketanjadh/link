import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogContent } from '@angular/material/dialog';
import { NodeEdgeRuleComponent } from '../node-edge-rule/node-edge-rule.component';
import { GraphService } from '../shared/graph.service';
import { CommonService } from '../shared/common.service';
import { DefaultComponent } from '../default/default.component';
import { DailogDataComponent } from '../dailog-data/dailog-data.component';
import jquery from 'jquery';
import * as cytoscape from 'cytoscape';
import { saveAs } from 'file-saver'
import * as jslinq from "jslinq";

export interface dialogData {
	type: string,
	title: string,
	message?: string
}

@Component({
	selector: 'app-navigation-ui',
	templateUrl: './navigation-ui.component.html',
	styleUrls: ['./navigation-ui.component.scss']
})
export class NavigationUiComponent implements OnInit {
	selected: number;
	graphDataArray: any;
	constructor(
		public _gs: GraphService,
		public _cs: CommonService,
		private dialog: MatDialog,
		private parentApi: DefaultComponent) {
		this._gs.cyIndex.subscribe((res: number) => this.selected = res);
	}

	ngOnInit(): void {
		this._gs.dataArr.subscribe(res => this.graphDataArray = res);
	}

	createNodeRules() {
		this._gs.createNodeRuleModalFlag = true;
		this._gs.manageNodeRuleModalFlag = false;
		const dialog = this.dialog.open(NodeEdgeRuleComponent, { panelClass: 'node_edge_rule' });
		dialog.afterClosed().subscribe(console.log)
	}

	manageNodeRules() {
		this._gs.manageNodeRuleModalFlag = true;
		this._gs.createNodeRuleModalFlag = false;
		const dialog = this.dialog.open(NodeEdgeRuleComponent, { panelClass: 'node_edge_rule' });
		dialog.afterClosed().subscribe(console.log)
	}

	/**FOR CHANGE LAYOUT TYPE**/
	changeLayout(layoutname) {
		this._gs.layoutName = layoutname;
		const layout = this._gs.cy[this.selected].layout({
			name: layoutname,
			animate: this._gs.layoutAnim,
			animationDuration: 5000,
			sampleSize: 10,
			samplingType: true,
			nodeSeparation: 500, // Separation amount between nodes 
			piTol: 0.0000001, // Power iteration tolerance
			nodeRepulsion: 4500,  /* incremental layout options , Node repulsion (non overlapping) multiplier*/
			idealEdgeLength: 50,  // Ideal edge (non nested) length
			edgeElasticity: 0.45, // Divisor to compute edge forces
			nestingFactor: 0.1	// Nesting factor (multiplier) to compute ideal edge length for nested edges  
		});
		layout.run()
	}




	/**FOR INVERT SELECTION OF NODES**/
	invertSelection() {		
		let allItems =  this._gs.cy[this.selected].elements().map(item => item.id());	
		let selectedItemIds = this._gs.selectedItems.map(item => item.data.id);			
		this._gs.notSelectedNodes = allItems.filter(item => selectedItemIds.indexOf(item) < 0);
	    this.selectAndDeselect(selectedItemIds, this._gs.notSelectedNodes);			
	}

	selectAndDeselect(selected, notselected) {		
		selected.forEach(item => {
			this._gs.cy[this.selected].$(`#${item}`).deselect();
			this._gs.selectedItems = this._gs.selectedItems.filter(x => x.data.id !== item);
		});
		notselected.forEach(item => {
			this._gs.cy[this.selected].$('#' + item).select();		
			let objItem = this._gs.cy[this.selected].elements().filter(obj=> obj.id() == item);
			let isExists = this._gs.selectedItems.some(result => result?.data.id === item);
			if (!isExists) this._gs.selectedItems.push(objItem.json());			
		})
	}

	resetAll() {
		this._gs.cy[this.selected].elements().remove();
		this._gs.cy[this.selected].add(this.graphDataArray);
	    this._gs.layoutAnim = false;		
		this.changeLayout(this._gs.defaultLayout);
		this._gs.isResetgraph = true;
	}

	/**for deleted selected nodes**/
	onDeleteNodeMulti() {
		console.log(this._gs.selectedIds)
		this._gs.selectedIds.forEach((item) => {
			this._gs.cy[this.selected].remove('#' + item)
		});
		this._gs.isSelected = false;
	}

	/**MARKED AS CENTRAL**/
	markCentralNodes() {
		if(this._gs.selectedIds.length){
		this._gs.selectedIds.forEach((item) => {
			this._gs.centralNodes.push(item);
		})		
	  const dialogRef = 	this.dialog.open(DailogDataComponent, {
			width: '350px',
			maxWidth: '400px',
			data: { type: 'alertMsg', title: "Alert", message: "Central nodes has been marked successfully." }
		});
		dialogRef.afterClosed().subscribe(dialogResult=>{
			this._gs.isSelected = false;
			this._gs.isCentralNodeSel = true;
		});	
	}else{
		this.dialog.open(DailogDataComponent, {
			width: '350px',
			maxWidth: '400px',
			data: { type: 'alertMsg', title: "Alert", message: "Please select node." }
		});
	  }	
	}

	/**SHOW CENTRAL NODES IF SET**/
	showCentralNodes() {
		this._gs.centralNodes.forEach((item) => {
			this._gs.cy[this.selected].$('#' + item).style({
				"width": "70%",
				"height": "70%"
			});
		})
	}

	/**GET CENTRAL NODE**/
	getCentralNode() {
		var nodes = this._gs.cy[this.selected].elements().filter('node');
		var nodeTemp = "";
		var nodeDegree = 0;
		nodes.forEach((item) => {
			if ((this._gs.cy[this.selected].$().dc({ root: '#' + item.id() }).degree) > nodeDegree) {
				nodeDegree = this._gs.cy[this.selected].$().dc({ root: '#' + item.id() }).degree;
				nodeTemp = item;
			}
		});
	}




	openQueryDialog() {
		let dialogRef = this.dialog.open(DailogDataComponent, {
			width: '350px',
			maxWidth: '400px',
			data: { type: 'addQuery', title: "Add Query" }
		});
		dialogRef.afterClosed().subscribe(dialogResult => {
			console.log(`Dialog Result ${dialogResult}`)
		})
	}

	addNewGraph(query) {
		this.selected++;
		this._cs.getWebData('http://192.168.2.114/neoapi/fetchDetails/', query.value).subscribe(res => {
			let data = res["Output"];
			let newArr3 = [...data["nodes"], ...data["edges"]];
			this.parentApi.addTab();
			setTimeout(() => {
				newArr3.forEach((item) => {
					this._gs.cy[this.selected].add(item);
				});
				this.changeLayout(this._gs.layoutName);
			}, 1000);
		},
			err => console.log(err))
	}

	/**MANAGE NODES OR EDGES PROPERTY**/
	updatePropery(elementType, ...args: any) {
		if(this._gs.cy[this.selected]){
		let selectedItems = this._gs.cy[this.selected].elements().filter(elementType).filter(item => item.selected());
		let proPerties = args;
		if(selectedItems.length){
		proPerties.forEach(prop => {
			let propetyName = prop.split(':')[0];
			let value = prop.split(':')[1];
			selectedItems.map((item) => item.style({ [propetyName]: value }))

			if (elementType == 'edge' && propetyName == 'line-color') {
				selectedItems.map((item) => item.style({ 'target-arrow-color': value }))
			}
		})
	 }else{
		 this.dialog.open(DailogDataComponent, {
			 width:"350px",
			 maxWidth:"400px",
			 data:{type:"alertMsg", title:"Alert", message:"Please select node/edge."}
		 })
	 }
	}
	}

	/**LEAVES NODES***/
	LeavesNode() {
		var nodes = this._gs.cy[this.selected].elements().filter('node');
		if (this._gs.leaveflag) {
			nodes.forEach(item => {
				let connectedNodes = this._gs.cy[this.selected].$('#' + item.id()).connectedEdges().length;
				if (connectedNodes == 1) {
					this._gs.cy[this.selected].$('#' + item.id()).addClass('leavesNodes')
				}
			})
			this._gs.leaveflag = false;
		} else {
			nodes.forEach(item => {
				this._gs.cy[this.selected].$(`#${item.id()}`).removeClass('leavesNodes');
				this._gs.leaveflag = true;
			})
		}
	}

	/**NEIGHBOURS SELECTION**/
	showNeightbours() {
		this._gs.flagActiveNeighbours = true;
		this._gs.selectedIds.forEach(item => {
			let el = this._gs.cy[this.selected].$(`#${item}`).addClass('hoverdNode');
			el.outgoers().addClass('outgoers');
			el.incomers().addClass('incomers');
		})
	}

	/**RESET NEIGHBORS**/
	resetNeighbors() {
		this.clearNeighbours();
		this.clearSelection();
	}

	clearNeighbours() {
		this._gs.flagActiveNeighbours = false;
		let allnodes = this._gs.cy[this.selected].elements().filter('node').map(item => item.id());
		allnodes.forEach(item => {
			let el = this._gs.cy[this.selected].$(`#${item}`).removeClass('hoverdNode');
			el.outgoers().removeClass('outgoers');
			el.incomers().removeClass('incomers');
		})
	}
	/**RESET NODE SELECTION**/
	resetSelection() {
		let allNodes = this._gs.cy[this.selected].elements().filter('node');
		allNodes.forEach((item) => {
			this._gs.cy[this.selected].$(`#${item.id()}`).deselect();
		})
		this.clearSelection();
	}
	clearSelection() {
		this._gs.selectedIds = [];
		this._gs.notSelectedNodes = [];
		this._gs.isSelected = false;
	}

	/**SELECT BY LABLES**/
	selectBylabel(lablename) {
		this.resetSelection();
		let nodes = this._gs.cy[this.selected].elements().filter('node');
		nodes.forEach(item => {
			if (item.data().label == lablename) {
				this._gs.cy[this.selected].$(`#${item.id()}`).select();
			}
		})
	}

	/**SHOW/HIDE NAVIGATOR**/
	navigatorFlag: boolean = false;
	showHideNavigator() {
		if (this.selected == 0) {
			let d: HTMLElement = document.querySelector('.cytoscape-navigator');
			if (d) {
				if (!this.navigatorFlag) {
					this.navigatorFlag = true;
					d.style.opacity = '1.0';
					d.style.zIndex = '9';
				} else {
					this.navigatorFlag = false;
					d.style.opacity = '0.0';
					d.style.zIndex = '-9';
				}
			}
		}
	}



	/**MAKE SUBGRAPH WITH THE SELECTED NODES**/
	subGraph() {
		this._gs.clipDataArr = [];
		if (this._gs.selectedItems.length) {			
			let nodeItems = this._gs.selectedItems.filter(item=> item.group == "nodes")
			let edgeItems = this._gs.selectedItems.filter(item=> item.group == "edges")
			this._gs.clipDataArr  = this._gs.clipDataArr.concat(nodeItems,edgeItems);
			this._gs.clipDataArr.forEach(item=> item.selected = false);		
		if (this._gs.clipDataArr.length) {
				let currentIndex = this.selected + 1
				this._gs.cyIndex.next(currentIndex);
				this._gs.tabs.push('Subgraph - ' + currentIndex)
				setTimeout(() => {
					this.newChart(currentIndex);
					this._gs.cy[currentIndex].scratch();				
						this._gs.cy[currentIndex].add(nodeItems);
						this._gs.cy[currentIndex].add(edgeItems);										
					this._gs.cy[currentIndex].fit();
					this._gs.cy[currentIndex].zoom(1);;
				}, 1000);
			}
		} else{
			this.dialog.open(DailogDataComponent, {
				width: '350px',
				maxWidth: '400px',
				data: { type: 'alertMsg', title: "Alert", message: "Please select atleast single node." }
			});
		}
	}
   


	newChart(index) {
		let _selector = document.getElementById('cy' + index);
		if (_selector) {
			this._gs.cy[index] = cytoscape({
				container: _selector,
				layout: {
					name: this._gs.layoutName,
					fit: true
				},
				style: this._gs.styleArr
			})

		}
	}

	/**METHOD TO CHANGE SELECTED NODES ICON IMAGE**/
	changeNodeImage() {
		if (this._gs.selectedIds.length) {
			let dialogRef = this.dialog.open(DailogDataComponent, {
				width: '450px',
				maxWidth: '500px',
				data: { type: 'nodeBG', title: "Change node background image" }
			});
			dialogRef.afterClosed().subscribe(dialogResult => console.log(`Dialog Result ${dialogResult}`))
		} else {
			let dialogRef = this.dialog.open(DailogDataComponent, {
				width: '350px',
				maxWidth: '400px',
				data: { type: 'alertMsg', title: "Alert", message: "Please select atleast single node to change background." }
			});
			dialogRef.afterClosed().subscribe(dialogResult => console.log(`Dialog Result ${dialogResult}`))
		}
	}

	/**EXPORT GRAPH AS IMAGE**/
	exportGraphImage() {
		saveAs(this._gs.cy[this.selected].jpg(), "link-analysys-graph.jpg");
	}

	/**EXPORT AS GRAPHML**/
	exportGraphML() {
		var fileContents = this._gs.cy[this.selected].graphml();
		var filename = "link-analysys-graphML.xml";
		var filetype = "xml/plain";
		var a = document.createElement("a");
		var dataURI = "data:" + filetype + ";base64," + btoa(fileContents);
		a.href = dataURI;
		a['download'] = filename;
		var e = document.createEvent("MouseEvents");
		e.initMouseEvent("click", true, false,
			document.defaultView, 0, 0, 0, 0, 0,
			false, false, false, false, 0, null);
		a.dispatchEvent(e);
	}

	/**IMPORT GRAPHML DATA FROM DIRECTORY AND GENERATE NEW GRAPH**/
	importGraphML() {
		this.dialog.open(DailogDataComponent, {
			width: "350px",
			maxWidth: "400px",
			data: { type: "importXml", title: "Import Graphml" }
		})
	}


	/**ADD NODES DEGREE**/
	addDegree() {
		this._gs.cy[this.selected].elements().remove();
		this._gs.cy[this.selected].add(this.graphDataArray);
		var nodes =  this._gs.cy[this.selected].elements().filter('node');
		let MaxDeg = this._gs.cy[this.selected].elements().maxDegree();
		nodes.forEach(item => {
			let deg = this._gs.cy[this.selected].$().dc({ root: '#' + item.id() }).degree;
			let nodeSize = ((deg * 100 / MaxDeg) / 1.4).toFixed(0) + "%";
			this._gs.cy[this.selected].$('#' + item.id()).style({
				"width": nodeSize,
				"height": nodeSize
			});
		})

	}
	/**REMOVE NODES DEGREE**/
	removeDegree() {
		this._gs.cy[this.selected].elements().remove();
		this._gs.cy[this.selected].add(this.graphDataArray);
	}

	getNodesCentrality() {
		this._gs.cy[this.selected].elements().remove();
		this._gs.cy[this.selected].add(this.graphDataArray);
		let nodes = this._gs.cy[this.selected].elements().filter('node');		
		let MaxDeg = 0;
		nodes.forEach((item) => {
			if (this._gs.cy[this.selected].$().cc({ root: '#' + item.id() }) > MaxDeg) {
				MaxDeg = this._gs.cy[this.selected].$().cc({ root: '#' + item.id() });
				console.log(MaxDeg);
			}
		});
		nodes.forEach((item) => {
			let deg = this._gs.cy[this.selected].$().cc({ root: '#' + item.id() });
			let nodeSize = ((deg * 100 / MaxDeg) / 1.4).toFixed(0) + "%";
			this._gs.cy[this.selected].$('#' + item.id()).style({
				"width": nodeSize,
				"height": nodeSize
			});
		});
	}

	getNodesBetweenness() {
		this._gs.cy[this.selected].elements().remove();
		this._gs.cy[this.selected].add(this.graphDataArray);
		let nodes = this._gs.cy[this.selected].elements().filter('node');
		//let MaxDeg  =   this.cy[this.selected].elements().maxDegree();
		let MaxDeg = 0;
		nodes.forEach((item) => {
			if (this._gs.cy[this.selected].$().bc().betweenness('#' + item.id()) > MaxDeg) {
				MaxDeg = this._gs.cy[this.selected].$().bc().betweenness('#' + item.id());
			}
		});

		nodes.forEach((item) => {
			let deg = this._gs.cy[this.selected].$().bc().betweenness('#' + item.id());
			let nodeSize = ((deg * 100 / MaxDeg) / 1.4).toFixed(0) + "%";
			this._gs.cy[this.selected].$('#' + item.id()).style({
				"width": nodeSize,
				"height": nodeSize
			});
		});

	}

	getNodesPageRank() {
		this._gs.cy[this.selected].elements().remove();
		this._gs.cy[this.selected].add(this.graphDataArray);
		let nodes = this._gs.cy[this.selected].elements().filter('node');
		// let MaxDeg  =   this.cy[this.selected].elements().maxDegree();
		let MaxDeg = 0;
		nodes.forEach((item) => {
			if (this._gs.cy[this.selected].elements().pageRank().rank('#' + item.id()) > MaxDeg) {
				MaxDeg = this._gs.cy[this.selected].elements().pageRank().rank('#' + item.id());
			}
		});
		nodes.forEach((item) => {
			let deg = this._gs.cy[this.selected].elements().pageRank().rank('#' + item.id());
			let nodeSize = ((deg * 100 / MaxDeg) / 1.4).toFixed(0) + "%";
			this._gs.cy[this.selected].$('#' + item.id()).style({
				"width": nodeSize,
				"height": nodeSize
			});
		});
	}

	/**EXPLODE FOR SELECTED NODE**/
	explodeSelected() {
		if (this._gs.selectedIds.length) {
			let explodeids = this._gs.selectedIds.toString();
			this._cs.getWebData('http://192.168.2.114/neoapi/fetchDetails/', { "query": "Match (p)-[r]-(n) where ID(p) IN [" + explodeids + "] return p,r,n" })
				.subscribe(res => {
					let data = res["Output"];
					this._gs.dataArr = [...data["nodes"], ...data["edges"]]
					this._gs.dataArr.forEach((item) => {
					this._gs.cy[this.selected].add(item);
					});
					this._cs.changeLayout(this._gs.defaultLayout);
				},
					err => console.log(err))
		} else {
			this.dialog.open(DailogDataComponent, {
				width:"350px",
				maxWidth:"400px",
				data: { type: "alertMsg", title: "Alert", message: "Please select node" }
			})
		}
	}



	/*CODE BY PUNEET*/
	getRulesInfo() {
		const dialogRef = this.dialog.open(DailogDataComponent, {
			width:"350px",
			maxWidth:"400px",
			data:{type:"applyNodeRule", title:"Select node rule"}
		})
	  dialogRef.afterClosed().subscribe(console.log);
	}


	// rulesvalue: any = "";
	// dataByRulesApiUrl: string = "http://192.168.2.114/vls/get_rule_data/"
	// applyRule() {
	// 	this._cs.getWebData(this.dataByRulesApiUrl, '{"Type":"node","Name":"' + this.rulesvalue + '"}').subscribe(
	// 		res => {
	// 			console.log(res.Data);
	// 			var result = res.Data;
	// 			console.log(result.condition)
	// 			var nodes = this._gs.cy[this.selected].elements().filter('node');
	// 			var ruleFlag = false;
	// 			nodes.some((item) => {
	// 				if (result.condition == 'AND') {
	// 					result.rules.some((rule, i) => {
	// 						if (rule.operator == 'equal') {

	// 							if (item._private.data[rule.field] == rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] == rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}
	// 						} else if (rule.operator == 'not equal') {
	// 							if (item._private.data[rule.field] != rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] != rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						} else if (rule.operator == 'less') {
	// 							if (item._private.data[rule.field] < rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] < rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						} else if (rule.operator == 'less_or_equal') {
	// 							if (item._private.data[rule.field] <= rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] <= rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						} else if (rule.operator == 'greater') {
	// 							if (item._private.data[rule.field] > rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] > rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'greater_or_equal') {
	// 							if (item._private.data[rule.field] >= rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] >= rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'between') {
	// 							if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'not_between') {
	// 							if (item._private.data[rule.field] < rule.value[0] && item._private.data[rule.field] > rule.value[1] && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}

	// 						else if (rule.operator == 'begins_with') {
	// 							if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						} else if (rule.operator == 'not_begins_with') {
	// 							console.log('not_begins_with');
	// 							if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'contains') {
	// 							if (item._private.data[rule.field].match(rule.value) != '' && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].matcg(rule.value) != '' && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'not_contains') {
	// 							if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'ends_with') {
	// 							if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'ends_with') {
	// 							if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'not_ends_with') {
	// 							if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}

	// 						else if (rule.operator == 'is_empty') {
	// 							if (item._private.data[rule.field] == "" && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] == "" && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'is_not_empty') {
	// 							if (item._private.data[rule.field] != "" && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] != "" && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'is_null') {
	// 							if (item._private.data[rule.field] == null && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] == null && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'is_not_null') {
	// 							if (item._private.data[rule.field] != null && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] != null && result.rules.length > 1) {
	// 								ruleFlag = true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}
	// 						}
	// 					});
	// 				} else {
	// 					result.rules.some((rule, i) => {

	// 						if (rule.operator == 'equal') {

	// 							if (item._private.data[rule.field] == rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] == rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;
	// 							} else {
	// 								ruleFlag = false;

	// 							}
	// 						} else if (rule.operator == 'not equal') {
	// 							if (item._private.data[rule.field] != rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] != rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						} else if (rule.operator == 'less') {
	// 							if (item._private.data[rule.field] < rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] < rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						} else if (rule.operator == 'less_or_equal') {
	// 							if (item._private.data[rule.field] <= rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] <= rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;
	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						} else if (rule.operator == 'greater') {
	// 							if (item._private.data[rule.field] > rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] > rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;
	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'greater_or_equal') {
	// 							if (item._private.data[rule.field] >= rule.value && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] >= rule.value && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;
	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'between') {
	// 							if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'not_between') {
	// 							if (item._private.data[rule.field] < rule.value[0] && item._private.data[rule.field] > rule.value[1] && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}

	// 						else if (rule.operator == 'begins_with') {
	// 							if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						} else if (rule.operator == 'not_begins_with') {
	// 							console.log('not_begins_with');
	// 							if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'contains') {
	// 							if (item._private.data[rule.field].match(rule.value) != '' && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].matcg(rule.value) != '' && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;
	// 							} else {
	// 								ruleFlag = false;
	// 							}


	// 						}
	// 						else if (rule.operator == 'not_contains') {
	// 							if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'ends_with') {
	// 							if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'ends_with') {
	// 							if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'not_ends_with') {
	// 							if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}

	// 						else if (rule.operator == 'is_empty') {
	// 							if (item._private.data[rule.field] == "" && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] == "" && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;
	// 								return true;
	// 							}


	// 						}
	// 						else if (rule.operator == 'is_not_empty') {
	// 							if (item._private.data[rule.field] != "" && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] != "" && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'is_null') {
	// 							if (item._private.data[rule.field] == null && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] == null && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}


	// 						}
	// 						else if (rule.operator == 'is_not_null') {
	// 							if (item._private.data[rule.field] != null && result.rules.length == 1) {
	// 								ruleFlag = true;
	// 							} else if (item._private.data[rule.field] != null && result.rules.length > 1) {
	// 								ruleFlag = true;
	// 								return true;

	// 							} else {
	// 								ruleFlag = false;

	// 							}
	// 						}
	// 					});
	// 				}





	// 				if (ruleFlag) {
	// 					console.log('inside');
	// 					this._gs.cy[this.selected].$('#' + item.id()).style({
	// 						"background-image": result.icon,
	// 						"text-outline-color": result.labelforeground
	// 					});
	// 				}
	// 			});
	// 		},
	// 		err => console.log(err))
	// 	this.rulesFlag = false;
	// }

	selectLabel: string = "";
	RulesList: any = [];
	rulesFlag: boolean = false;	
	edgeRulesFlag: boolean = false;
	edgeListApiUrl: string = "http://192.168.2.114/vls/get_all_rules_name/";
	getEdgeRulesInfo() {
		this.edgeRulesFlag = true;
		this._cs.getWebData( this.edgeListApiUrl, '{"Type":"edge"}').subscribe(
			(res) => {
				console.log(res.Rules);
				this.selectLabel = "Select Edge Rule";
				this.RulesList = res.Rules
			},
			(err) => console.log(err));
	}

	applyEdgeRule(ruleValue) {
		this._cs.getWebData('http://192.168.2.114/vls/get_rule_data/', '{"Type":"edge","Name":"' + ruleValue.value + '"}').subscribe(res => {
			console.log(res.Data);
			var result = res.Data;
			// alert(JSON.stringify(result));
			console.log(result.condition)
			var nodes = this._gs.cy[this.selected].elements().filter('node');
			var ruleFlag = false;

			nodes.some((item) => {
				if (result.condition == 'AND') {
					result.rules.some((rule, i) => {
						if (rule.operator == 'equal') {

							if (item._private.data[rule.field] == rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] == rule.value && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}
						} else if (rule.operator == 'not equal') {
							if (item._private.data[rule.field] != rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] != rule.value && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						} else if (rule.operator == 'less') {
							if (item._private.data[rule.field] < rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] < rule.value && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						} else if (rule.operator == 'less_or_equal') {
							if (item._private.data[rule.field] <= rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] <= rule.value && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						} else if (rule.operator == 'greater') {
							if (item._private.data[rule.field] > rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] > rule.value && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'greater_or_equal') {
							if (item._private.data[rule.field] >= rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] >= rule.value && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'between') {
							if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'not_between') {
							if (item._private.data[rule.field] < rule.value[0] && item._private.data[rule.field] > rule.value[1] && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}

						else if (rule.operator == 'begins_with') {
							if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						} else if (rule.operator == 'not_begins_with') {
							console.log('not_begins_with');
							if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'contains') {
							if (item._private.data[rule.field].match(rule.value) != '' && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].matcg(rule.value) != '' && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'not_contains') {
							if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'ends_with') {
							if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'ends_with') {
							if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'not_ends_with') {
							if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}

						else if (rule.operator == 'is_empty') {
							if (item._private.data[rule.field] == "" && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] == "" && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'is_not_empty') {
							if (item._private.data[rule.field] != "" && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] != "" && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'is_null') {
							if (item._private.data[rule.field] == null && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] == null && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'is_not_null') {
							if (item._private.data[rule.field] != null && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] != null && result.rules.length > 1) {
								ruleFlag = true;

							} else {
								ruleFlag = false;
								return true;
							}


						}


					});
				} else {
					result.rules.some((rule, i) => {

						if (rule.operator == 'equal') {

							if (item._private.data[rule.field] == rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] == rule.value && result.rules.length > 1) {
								ruleFlag = true;
								return true;
							} else {
								ruleFlag = false;

							}
						} else if (rule.operator == 'not equal') {
							if (item._private.data[rule.field] != rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] != rule.value && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						} else if (rule.operator == 'less') {
							if (item._private.data[rule.field] < rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] < rule.value && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						} else if (rule.operator == 'less_or_equal') {
							if (item._private.data[rule.field] <= rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] <= rule.value && result.rules.length > 1) {
								ruleFlag = true;
								return true;
							} else {
								ruleFlag = false;

							}


						} else if (rule.operator == 'greater') {
							if (item._private.data[rule.field] > rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] > rule.value && result.rules.length > 1) {
								ruleFlag = true;
								return true;
							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'greater_or_equal') {
							if (item._private.data[rule.field] >= rule.value && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] >= rule.value && result.rules.length > 1) {
								ruleFlag = true;
								return true;
							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'between') {
							if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'not_between') {
							if (item._private.data[rule.field] < rule.value[0] && item._private.data[rule.field] > rule.value[1] && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}

						else if (rule.operator == 'begins_with') {
							if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].indexOf(rule.value) == 0 && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						} else if (rule.operator == 'not_begins_with') {
							console.log('not_begins_with');
							if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].indexOf(rule.value) != 0 && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'contains') {
							if (item._private.data[rule.field].match(rule.value) != '' && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].matcg(rule.value) != '' && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'not_contains') {
							if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].match(rule.value) == '' && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'ends_with') {
							if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'ends_with') {
							if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'not_ends_with') {
							if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}

						else if (rule.operator == 'is_empty') {
							if (item._private.data[rule.field] == "" && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] == "" && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;
								return true;
							}


						}
						else if (rule.operator == 'is_not_empty') {
							if (item._private.data[rule.field] != "" && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] != "" && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'is_null') {
							if (item._private.data[rule.field] == null && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] == null && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}


						}
						else if (rule.operator == 'is_not_null') {
							if (item._private.data[rule.field] != null && result.rules.length == 1) {
								ruleFlag = true;
							} else if (item._private.data[rule.field] != null && result.rules.length > 1) {
								ruleFlag = true;
								return true;

							} else {
								ruleFlag = false;

							}
						}
					});
				}

				if (ruleFlag) {
					console.log('inside');
					this._gs.cy[this.selected].$('#' + item.id()).style({
						"background-image": result.icon,
						"text-outline-color": result.labelforeground
					});
				}
			});
		},
			err => console.log(err))
		this.rulesFlag = false;
	}

	/**GET SHORTEST PATH BETWEEN TWO NODE**/
	getShortestPath() {		
		if (this._gs.selectedIds.length == 2) {
			let obj = {};
			obj["Type"] = "Shortest";
			obj["StartID"] = this._gs.selectedIds[0];
			obj["EndID"] =   this._gs.selectedIds[1];
			obj["MaxHops"] = "3";			
			this._cs.getWebData(this._cs.shortestPathUrl, obj).subscribe(res => {
				let data = res["Output"];
				let newArr = [...data["nodes"], ...data["edges"]];
				// this.parentApi.addTab();
				this._cs.addTab();
				setTimeout(() => {
					console.log(this._gs.selectedGraphId);
					console.log(this.selected);
					newArr.forEach((item) => {
						this._gs.cy[this.selected].add(item);
					});
					this.changeLayout(this._gs.layoutName);
				}, 1000);
			}, err => console.log(err))
		} else {
			this.dialog.open(DailogDataComponent, {
				width: "350px",
				maxWidth: "400px",
				data: { type: "alertMsg", title: "Alert", message: "Please select exactly two nodes to calculate the shortest path" }
			})
		}
	}

	/**SELECT NUMBER OF HOPES USING DIALOG BOX**/
	selectNoOfHops() {
		if (this._gs.selectedIds.length == 2) {
			let dialogRef = this.dialog.open(DailogDataComponent, {
				width: "350px",
				maxWidth: "400px",
				data: { type: 'pathByHopes', title: "Select Hopes Path" }
			})
			dialogRef.afterClosed().subscribe(console.log)
		} else {
			this.dialog.open(DailogDataComponent, {
				width: "350px",
				maxWidth: "400px",
				data: { type: "alertMsg", title: "Alert", message: "Please select exactly two nodes to calculate the Path by hops" }
			})
		}
	}
	/**GET CIRCULAR PATH OF NODES**/
	getCircularPath() {
		if (this._gs.selectedIds.length == 2) {
			let obj = {};
			obj["Type"] = "ByHops";
			obj["StartID"] = this._gs.selectedIds[0];
			obj["EndID"] =   this._gs.selectedIds[1];
			obj["MaxHops"] = "6";			
			this._cs.getWebData(this._cs.shortestPathUrl, obj).subscribe(
				res => {
					console.log(res);
				},
				err => console.log(err))
		} else {
			this.dialog.open(DailogDataComponent, {
				width: "350px",
				maxWidth: "400px",
				data: { type: "alertMsg", title: "Alert", message: "Please select exactly two nodes to calculate the circular path" }
			})
		}
	}

	/**CHANGE LAYOUT CHANGING ANIMATION MODE**/
	layoutAnimationMode(){
		this.dialog.open(DailogDataComponent, {
			width: "350px",
			maxWidth: "400px",
			data: { type: "layoutAnimation", title: "Layout animation"}
		})
		
	}



	/**SHOW TIMELINE POPUP TO SELECT THE LABEL**/
	showTimeline() {
		let dialogRef = this.dialog.open(DailogDataComponent, {
			width: '350px',
			maxWidth: '400px',
			data: { type: 'timeLine', title: "Select Timeline Attribute" }
		});
		dialogRef.afterClosed().subscribe(dialogResult => {
			console.log(`Dialog Result ${dialogResult}`)
		})
	}

	restoreGraph(){
		// this._gs.tabs  = [this._gs.tabs[0]]
		// this._gs.cyIndex.next(0);
		// this.resetAll() 
		this._cs.isRestore.next(true)  
   }



}
