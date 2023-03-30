import { Component, OnInit } from '@angular/core';
import { GraphService } from '../shared/graph.service';
import { CommonService } from '../shared/common.service';
declare var $: any;
import * as jslinq from "jslinq";


@Component({
	selector: 'app-right-tabs-nav',
	templateUrl: './right-tabs-nav.component.html',
	styleUrls: ['./right-tabs-nav.component.scss']
})
export class RightTabsNavComponent implements OnInit {
	graphDataArray: any = [];
	selectedEdgeItem: any = ""
	selected: any;
	nodeCount: any;
	edgeCount: any;
	graphName: any = "Main";
	nodeLabelArr: any = [];
	edgeLabelArr: any = [];
	histogramHeader: any = [];
	genderArr: any;
	dataMap: any = new Map();
	graphFlowCount: any = 0;
	graphNodeCount: any = 0;
	graphEdgeCount: any = 0;
	verticesBadgeCount: any = 0;
	histogramFilterCountMap: any = new Map();



	constructor(public grphservice: GraphService) {
		this.grphservice.cyIndex.subscribe(res => this.selected = res);
		this.grphservice.detectItemSection.subscribe(res => {
			if (res) this.selectedEdgeItem = this.grphservice.selectedItems.filter(item => item.group == 'edges');
		})
	}

	ngOnInit(): void {
		setTimeout(() => {
			this.initializeGraphData();
			this.initializeHistogramData();
		}, 3000);
		this.grphservice.dataArr.subscribe(res => this.graphDataArray = res);
	}


	/**  Right panel Initialize Graph Data **/

	initializeGraphData() {
		this.nodeCount = this.graphDataArray.filter(item => item.group == 'nodes').length;
		this.edgeCount = this.graphDataArray.filter(item => item.group == 'edges').length;
		var arryNodes = this.graphDataArray.filter(item => item.group == 'nodes');
		var edgesArr = this.graphDataArray.filter(item => item.group == 'edges');

		edgesArr.map(el => {
			if (this.edgeLabelArr[el.data.label] === undefined || this.edgeLabelArr[el.data.label] === 0) {
				this.edgeLabelArr[el.data.label] = 1
			} else {
				this.edgeLabelArr[el.data.label] = this.edgeLabelArr[el.data.label] + 1
			}
		})
		var newArr: any;
		var queryObj = jslinq(arryNodes);
		newArr = queryObj.groupBy(function (el: any) {
			return el.data.label;
		})

		newArr.toList().forEach((item) => {
			let obj = {}
			obj["label"] = item.key;
			obj["count"] = item.count;
			obj["bgImage"] = this.grphservice.cy[this.selected].$(`#${item.elements[0].data.id}`).style().backgroundImage;
			this.nodeLabelArr.push(obj)


		})




		/*  arryNodes.map( el => {
		 if (this.nodeLabelArr[el.data.label] === undefined || this.nodeLabelArr[el.data.label] === 0) {
			 this.nodeLabelArr[el.data.label] = 1
		 } else {
			 this.nodeLabelArr[el.data.label] = this.nodeLabelArr[el.data.label] + 1
		 }
		})*/


	}

	/**Right Panel initalize histogram data **/
	initializeHistogramData() {
		var nodesArr = this.graphDataArray.filter(item => item.group == 'nodes');
		var queryObj = jslinq(nodesArr);
		var labelValarr: any = [];
		var map3 = new Map();
		var histogramArr = [];
		this.nodeLabelArr.forEach((item) => {

			labelValarr.push(item.label);
		})

		this.grphservice.getHistogramData().subscribe(res => {
			let data = res["Output"].Histogram;
			data.forEach((item) => {
				if ((item.TargetFilter == 'Node' && labelValarr.includes(item.filters.Label)) || (item.TargetFilter == 'Node' && labelValarr.includes('test_person'))) {

					if (item.filters.Type == 'Discrete') {
						histogramArr = [];

						this.genderArr = queryObj.groupBy(function (el: any) {
							return el.data[item.filters.Property];
						})
						let max = Math.max.apply(null, this.genderArr.toList().map(item => item.count));
						this.genderArr.toList().forEach((itemData) => {

							let obj = {};
							obj["data"] = itemData.key;
							obj["count"] = itemData.count;
							obj["property"] = item.filters.Property;
							obj["filterType"] = item.filters.Type;
							obj["barFillPercent"] = ((itemData.count * 100 / max)).toFixed(0) + "%";
							histogramArr.push(obj);
						})
						this.dataMap.set(item.FilterName, histogramArr);
						this.histogramFilterCountMap.set(item.FilterName, 0);

					} else if (item.filters.Type == 'ContinuousFixed') {

						histogramArr = [];
						let maxV = 0;
						var rangeLimit = Math.round((item.filters.Max - item.filters.Min) / item.filters.Buckets);
						var minVal = parseInt(item.filters.Min);
						var maxVal = 0;

						for (var i = 0; i < item.filters.Buckets; i++) {
							maxVal = minVal + rangeLimit;
							var result = queryObj.where(function (el: any) {
								return el.data[item.filters.Property] >= minVal && el.data[item.filters.Property] < maxVal;
							}).toList();
							if (jslinq(result).count() > maxV) {
								maxV = jslinq(result).count();
							}
						}
						for (var i = 0; i < item.filters.Buckets; i++) {
							maxVal = minVal + rangeLimit;
							var result = queryObj.where(function (el: any) {
								return el.data[item.filters.Property] >= minVal && el.data[item.filters.Property] < maxVal;
							}).toList();

							let obj = {};
							obj["data"] = minVal + "-" + maxVal;
							obj["count"] = jslinq(result).count();
							obj["property"] = item.filters.Property;
							obj["filterType"] = item.filters.Type;
							obj["barFillPercent"] = ((jslinq(result).count() * 100 / maxV)).toFixed(0) + "%";
							histogramArr.push(obj);
							minVal = maxVal;
						}

						this.dataMap.set(item.FilterName, histogramArr);
						this.histogramFilterCountMap.set(item.FilterName, 0);

					} else if (item.filters.Type == 'Continuous') {
						histogramArr = [];
						let maxVal = 0;
						var maxValN: any = queryObj.max(function (el: any) { return el.data[item.filters.Property]; });
						var minValN: any = queryObj.min(function (el: any) { return el.data[item.filters.Property]; });
						var rangeLimitN = Math.round((maxValN - minValN) / item.filters.Buckets);

						for (var i = 0; i < item.filters.Buckets; i++) {
							var tempMaxVal = minValN + rangeLimitN;
							var result = queryObj.where(function (el: any) {
								return el.data[item.filters.Property] >= minValN && el.data[item.filters.Property] < tempMaxVal;
							}).toList();

							if (jslinq(result).count() > maxVal) {
								maxVal = jslinq(result).count();
							}
						}

						for (var i = 0; i < item.filters.Buckets; i++) {
							var tempMaxVal = minValN + rangeLimitN;
							var result = queryObj.where(function (el: any) {
								return el.data[item.filters.Property] >= minValN && el.data[item.filters.Property] < tempMaxVal;
							}).toList();

							let obj = {};
							obj["data"] = minValN + "-" + tempMaxVal;
							obj["count"] = jslinq(result).count();
							obj["property"] = item.filters.Property;
							obj["filterType"] = item.filters.Type;
							obj["barFillPercent"] = ((jslinq(result).count() * 100 / maxVal)).toFixed(0) + "%";
							histogramArr.push(obj);
							minValN = tempMaxVal;
						}

						this.dataMap.set(item.FilterName, histogramArr);
						this.histogramFilterCountMap.set(item.FilterName, 0);
					}

					else if (item.filters.Type == 'Date') {
						histogramArr = [];
						let maxVal = 0;
						if (item.filters.Buckets == 'Monthly') {
							var monthArr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
							for (var i = 0; i < monthArr.length; i++) {
								var result = queryObj.where(function (el: any) {
									return monthArr[new Date(el.data[item.filters.Property] * 1000).getMonth()] == monthArr[i];
								}).toList()
								if (jslinq(result).count() > maxVal) {
									maxVal = jslinq(result).count();
								}

							} for (var i = 0; i < monthArr.length; i++) {
								var result = queryObj.where(function (el: any) {
									return monthArr[new Date(el.data[item.filters.Property] * 1000).getMonth()] == monthArr[i];
								}).toList()

								let obj = {};
								obj["data"] = monthArr[i];
								obj["count"] = jslinq(result).count();
								obj["property"] = item.filters.Property;
								obj["filterType"] = item.filters.Type;
								obj["barFillPercent"] = ((jslinq(result).count() * 100 / maxVal)).toFixed(0) + "%";

								histogramArr.push(obj);


							}
						}


						this.dataMap.set(item.FilterName, histogramArr);
						this.histogramFilterCountMap.set(item.FilterName, 0);

					}

				}
			})
			//console.log(this.histogramFilterCountMap.get("personbygender")); 
		}, err => console.log(err))




	}

	/**RIGHT PROFILE PANEL SELECT/DESELECT ON NODES/EDGES**/
	selectAllItems(event, itemType) {
		let graphItem = this.grphservice.cy[this.selected].elements().filter(itemType);
		if (event.target.checked) {
			this.graphFlowCount++;
			graphItem.forEach((item) => {
				this.grphservice.cy[this.selected].$('#' + item.id()).select();
			});
		} else {
			this.graphFlowCount--;
			graphItem.forEach((item) => {
				this.grphservice.cy[this.selected].$('#' + item.id()).deselect();
			});
		}
	}



	customizeNodeSelection(event, nodeProperty, value) {
		var nodesArr = this.graphDataArray.filter(item => item.group == 'nodes');
		console.log(nodesArr);
		var queryObj = jslinq(nodesArr);
		var result = queryObj.where((el:any)=> {
			return el.data[nodeProperty] == value;
		}).toList();
		if (event.target.checked) {
			this.graphNodeCount++;
			result.forEach((itemData:any) => {
				this.grphservice.cy[this.selected].$('#'+itemData.data.id).select();
			});
		} else {
			this.graphNodeCount--
			result.forEach((itemData: any) => {
				this.grphservice.cy[this.selected].$('#'+itemData.data.id).deselect();
			});
		}
	}


	customizeEdgeSelection(event, edgeProperty, value) {
		var edgesArr =  this.graphDataArray.filter(item => item.group == 'edges');
		var queryObj = jslinq(edgesArr);
		var result = queryObj.where((el: any)=> {
			return el.data[edgeProperty] == value;
		}).toList();
		console.log(result);
		if (event.target.checked) {
			this.graphEdgeCount++
			result.forEach((itemData: any) => {
				this.grphservice.cy[this.selected].$('#' + itemData.data.id).select();
			});
		} else {
			this.graphEdgeCount--
			result.forEach((itemData: any) => {
				this.grphservice.cy[this.selected].$('#' + itemData.data.id).deselect();
			});
		}

	}

	customizeNodeEdgeSelection(event, nodeProperty, edgeProp, nodeValue, edgeValue) {


		var nodesArr = this.graphDataArray.filter(item => item.group == 'nodes');

		var queryObj = jslinq(nodesArr);
		var resultNode = queryObj.where(function (el: any) {
			return el.data[nodeProperty] == nodeValue;
		}).toList();

		var edgesArr = this.graphDataArray.filter(item => item.group == 'edges');

		var queryObj = jslinq(edgesArr);
		var resultEdge = queryObj.where(function (el: any) {
			return el.data[edgeProp] == edgeValue;
		}).toList();

		if (event.target.checked) {
			this.verticesBadgeCount++
			resultNode.forEach((itemData: any) => {
				this.grphservice.cy[this.selected].$('#' + itemData.data.id).addClass('hoverdNode');

			});
			resultEdge.forEach((itemData: any) => {

				this.grphservice.cy[this.selected].$('#' + itemData.data.id).addClass('outgoers');

			});

		} else {
			this.verticesBadgeCount--
			resultNode.forEach((itemData: any) => {
				this.grphservice.cy[this.selected].$('#' + itemData.data.id).removeClass('hoverdNode');

			});
			resultEdge.forEach((itemData: any) => {

				this.grphservice.cy[this.selected].$('#' + itemData.data.id).removeClass('outgoers');

			});



		}


	}

	nodeSelectionHistogram(event, nodeProperty, value, filtertype, filterName) {

		if (event.target.checked) {
			var nodesArr = this.graphDataArray.filter(item => item.group == 'nodes');
			var queryObj = jslinq(nodesArr);

			if (filtertype == 'Discrete') {

				var result = queryObj.where(function (el: any) {
					return el.data[nodeProperty] == value;
				}).toList();
				result.forEach((itemData: any) => {

					this.grphservice.cy[this.selected].$('#' + itemData.data.id).addClass('hoverdNode');

				});

			} else if (filtertype == 'ContinuousFixed' || filtertype == 'Continuous') {

				var result = queryObj.where(function (el: any) {
					return el.data[nodeProperty] >= value.substring(0, value.indexOf("-"))
						&& el.data[nodeProperty] < value.substring(value.indexOf("-") + 1, value.length);
				}).toList();
				result.forEach((itemData: any) => {

					this.grphservice.cy[this.selected].$('#' + itemData.data.id).addClass('hoverdNode');

				});

			} else if (filtertype == 'Date') {
				var monthArr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
				var result = queryObj.where(function (el: any) {
					return monthArr[new Date(el.data[nodeProperty] * 1000).getMonth()] == value;
				}).toList()
				result.forEach((itemData: any) => {

					this.grphservice.cy[this.selected].$('#' + itemData.data.id).addClass('hoverdNode');

				});

			}

			this.histogramFilterCountMap.set(filterName, this.histogramFilterCountMap.get(filterName) + 1);
		} else {


			var nodesArr = this.graphDataArray.filter(item => item.group == 'nodes');
			var queryObj = jslinq(nodesArr);

			if (filtertype == 'Discrete') {

				var result = queryObj.where(function (el: any) {
					return el.data[nodeProperty] == value;
				}).toList();
				result.forEach((itemData: any) => {

					this.grphservice.cy[this.selected].$('#' + itemData.data.id).removeClass('hoverdNode');

				});

			} else if (filtertype == 'ContinuousFixed' || filtertype == 'Continuous') {

				var result = queryObj.where(function (el: any) {
					return el.data[nodeProperty] >= value.substring(0, value.indexOf("-"))
						&& el.data[nodeProperty] < value.substring(value.indexOf("-") + 1, value.length);
				}).toList();
				result.forEach((itemData: any) => {

					this.grphservice.cy[this.selected].$('#' + itemData.data.id).removeClass('hoverdNode');

				});

			} else if (filtertype == 'Date') {
				var monthArr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
				var result = queryObj.where(function (el: any) {
					return monthArr[new Date(el.data[nodeProperty] * 1000).getMonth()] == value;
				}).toList()
				result.forEach((itemData: any) => {

					this.grphservice.cy[this.selected].$('#' + itemData.data.id).removeClass('hoverdNode');

				});

			}
			this.histogramFilterCountMap.set(filterName, this.histogramFilterCountMap.get(filterName) - 1);
		}
	}

	/**RIGHT PROFILE PANEL**/
	activeIndex: number = null;
	profileToggle(elem) {
		if (this.activeIndex == elem) this.activeIndex = null;
		else this.activeIndex = elem;
	}


	Gdetails = true;
	Gflows = true;
	Gnodes = true;
	Gedges = true;


	Vdetails = true;
	Vpropertes = true;
	Vvertices = true;

	Edetails = true;
	Eflows = true;
	Epropertes = true;

	Hdetails = true;
	Hflows = true;

	Hedges = true;

}
