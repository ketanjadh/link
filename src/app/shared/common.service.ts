import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GraphService } from './graph.service';
import * as cytoscape from 'cytoscape';
import navigator from 'cytoscape-navigator';
import { MatDialog } from '@angular/material/dialog';
@Injectable({
	providedIn: 'root'
})

export class CommonService {
	selected: number;
	isHideDialog: any = new BehaviorSubject(false);
	isRestore:any = new BehaviorSubject(false);
	shortestPathUrl: string = "http://192.168.2.114/neoapi/hopsNode/";
	headers = new HttpHeaders({ 'Content-Type': 'application/json; charset=utf-8' });

	constructor(private http: HttpClient, 
		private _gs: GraphService,
		private dialog:MatDialog) {
		this._gs.cyIndex.subscribe((res: number) => this.selected = res);
	}




	/**METHOD TO  PREFORM CUT OPERATION OF NODE/EDGE**/
	Cut() {
		this._gs.clipDataArr = [];
		let selectedItem = this._gs.cy[this.selected].$(':selected');	
		console.log(selectedItem);
		selectedItem.forEach(item => {
			this._gs.cy[this.selected].$('#' + item.id()).remove()
		})
		selectedItem.forEach(item => {
			this._gs.clipDataArr.push(item.json());
		})
}
	/**METHOD TO PREFORM COPY OPERATION OF NODE/EDGE**/
	Copy() {
		this._gs.clipDataArr = [];
		let selectedItem = this._gs.cy[this.selected].$(':selected');
		selectedItem.forEach(item => {
			this._gs.clipDataArr.push(item.json())
		})
	}
	/**METHOD TO PREFORM PASTE OPERATION OF NODE/EDGE**/
	Paste() {
		let mydata = this._gs.clipDataArr;
		if(mydata.length){	
		mydata.forEach((item) => {
			this._gs.cy[this.selected].add(item);
			this._gs.cy[this.selected].$('#' + item).deselect();
		});
		this._gs.cy[this.selected].fit();	
	  }
	}


	/**FOR CHANGE LAYOUT TYPE**/
	changeLayout(layoutname) {	
		const layout = this._gs.cy[this.selected].layout({
			name: layoutname,
			animate: this._gs.layoutAnim,
			animationDuration: 5000,
			sampleSize: 10,
			samplingType: true,
			nodeSeparation: 500,
			piTol: 0.0000001,
			nodeRepulsion: 4500,
			idealEdgeLength: 50, 
			edgeElasticity: 0.45, 
			nestingFactor: 0.1
		});
		layout.run()
	}

	/**INITILISE NAVIGATOR**/
	initNavigator() {
		if (typeof cytoscape('core', 'navigator') !== 'function') {
			navigator(cytoscape);
			this._gs.cy[this.selected].navigator();
		}
	}

	/**METHOD FOR ADD NEW CHART WITH NEW TAB**/
	tabIndex:any = 0;
	subgraphIndex:number=0;
	isNewTabAdded:boolean = false;
	addTab() { 
	  this.subgraphIndex = Math.max(0, (this._gs.tabs.length - 1)); 
	  this.tabIndex = this.selected;  
	  this.isNewTabAdded   = true;
	  this.subgraphIndex++   
	  this.tabIndex = Math.max(0, this._gs.tabs.length);  
	  this._gs.selectedGraphId += 1; 
	  this._gs.cyIndex.next(this.tabIndex);    
	  this._gs.tabs.push('Subgraph - ' + this.subgraphIndex);   
	  setTimeout(() => {
		this.newChart(this.tabIndex);
		this._gs.cy[this.tabIndex].scratch();              
	  }, 1000);  
	}

	// tabIndex: any = 0;
	// subgraphIndex: number = 0;
	// addTab() {
	// 	this.subgraphIndex = Math.max(0, this._gs.tabs.length);
	// 	this.tabIndex = this.selected;
	// 	this.subgraphIndex++
	// 	this.tabIndex += 1;
	// 	this._gs.selectedGraphId += 1;
	// 	this._gs.cyIndex.next(this.tabIndex);
	// 	this._gs.tabs.push('Subgraph - ' + this.subgraphIndex);
	// 	setTimeout(() => {
	// 		this.newChart(this.tabIndex);
	// 		this._gs.cy[this.tabIndex].scratch();
	// 	}, 1000);
	// }
	/**ADD NEW SCRATCH CHART**/
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



	getData(url): Observable<any> {
		return this.http.get<any>(url);
	}

	getStyle(url): Observable<any> {
		return this.http.get(url);
	}

	getWebData(url: any, body: {}): Observable<any> {
		let headers = new HttpHeaders()
			.set('content-type', 'application/json')
			.set('Access-Control-Allow-Origin', '*');
		return this.http.post<any>(url, body, { 'headers': headers });
	}


}
