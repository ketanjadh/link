import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '../shared/common.service';
import { DefaultComponent } from '../default/default.component';
import { GraphService } from '../shared/graph.service';
import { dialogData } from '../navigation-ui/navigation-ui.component';
import * as cytoscape from 'cytoscape';
import * as jslinq from "jslinq";
@Component({
  selector: 'app-dailog-data',
  templateUrl: './dailog-data.component.html',
  styleUrls: ['./dailog-data.component.scss']
})
export class DailogDataComponent implements OnInit {
  selected:number;
  graphDataArray:any;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data:dialogData,   
    private dialogRef:MatDialogRef<DailogDataComponent>,
    public _gs:GraphService, private _cs:CommonService) {
      this._gs.cyIndex.subscribe((res:number) => this.selected = res);
      this._gs.dataArr.subscribe(res => this.graphDataArray = res);     
     }
  ngOnInit(): void { 
    this.initTimelineLabel();
	if(this.data.type = "applyNodeRule"){
		this.getRulesInfo();
	}   
  }



/**IMPORT GRAPHML AND UPDATE GRAPH**/
  uploadGraphML(e) {
    let currentIndex = this.selected + 1
    this._gs.cyIndex.next(currentIndex)
    this._gs.tabs.push('Subgraph - ' + currentIndex);
				setTimeout(() => {
					this.newChart(currentIndex);
					this._gs.cy[currentIndex].scratch();
          let file = e.target.files[0];
          this.readFileContent(file).then(content => {  
            console.log(content);  
           this._gs.cy[this.selected].graphml(content);    
          }).catch(error => console.log(error));
					this._gs.cy[currentIndex].fit();
					this._gs.cy[currentIndex].zoom(1);;
				}, 1000);
      this.onClose();    
	}

/**READ UPLOADED FILE USING FILE READER**/
  readFileContent(file) {
		const reader = new FileReader()
		return new Promise((resolve, reject) => {
			reader.onload = event => resolve(event.target.result)
			reader.onerror = error => reject(error)
			reader.readAsText(file)
		})
	}


  /**ADD QUERY**/
  @ViewChild(DefaultComponent, {static:false}) parentApi:DefaultComponent
  addNewGraph(query) {
		this.selected++;	
		this._cs.getWebData('http://192.168.2.114/neoapi/fetchDetails/', query.value).subscribe(res => {
			let data = res["Output"];
			let newArr3=[...data["nodes"], ...data["edges"]];
			this.parentApi.addTab();
				setTimeout(() => {					
					newArr3.forEach((item) => {
						this._gs.cy[this._gs.selectedGraphId].add(item);
					});
					this._cs.changeLayout(this._gs.defaultLayout);
				}, 1000);
		},
			err => console.log(err))
	}
  


/**FOR CHANGE NODE BACKGROUND IMAGE**/
public imagePath;
imgURL: any;
public message: string; 
preview(files) {
  if (files.length === 0)
    return; 
  var mimeType = files[0].type;
  if (mimeType.match(/image\/*/) == null) {
    this.message = "Only images are supported.";
    return;
  }  
  var reader = new FileReader();
   this.imagePath = files;    
  reader.readAsDataURL(files[0]); 
  reader.onload = (_event) => { 
    this.imgURL = reader.result; 
    if(this.imgURL){
      this._gs.bgImage.next(this.imgURL); 
      this.onClose();
    }   
  }   
}

/**CHANGE NODE ICON  IMAGE**/
changeBackground(imgUrl){  
  this._gs.bgImage.next(imgUrl);
  this.onClose();
}

/**CLOSE DIALOG BOX**/
 onClose(): void {   
    this.dialogRef.close(true);
  }

/**DYNAMIC NEW CHART**/
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


    /**INITILISE TIMELINE DROPDOWN DATA**/
	labelAttributesList: any = [];
  initTimelineLabel(){
    var nodesArr = this.graphDataArray.filter(item => item.group == 'nodes');
		var queryObj = jslinq(nodesArr);
		var newArr: any = queryObj.groupBy(function (el: any) {
			return el.data.label;
		})
		newArr.toList().forEach((item) => {
			for (var key in item.elements[0].data) {
				this.labelAttributesList.push(key);
			}
		})
  }
	getTimelineByAttribute(attr) {	
		this._gs.timelineAttrVal.next(attr)
		this._gs.timelineAttr.next(attr);	
    this.onClose();	
	}

/**SELECT PATH BY HOPES**/
  hopsPathVal: any; 
	getByHopsPath() {
		let jsonObj = {};	
			jsonObj["Type"] = "ByHops";
			jsonObj["StartID"] = this._gs.selectedIds[0];
			jsonObj["EndID"] = this._gs.selectedIds[1];
			jsonObj["MaxHops"] = this.hopsPathVal;
			console.log(jsonObj);
			this._cs.getWebData(this._cs.shortestPathUrl, jsonObj).subscribe(res => {
				let data = res["Output"];			
				let newArr2 = [...data["nodes"], ...data["edges"]];
        		this._cs.addTab();			
				setTimeout(() => {
					if(newArr2.length){
						newArr2.forEach((item) => this._gs.cy[this._gs.selectedGraphId].add(item));	
					}			
				 this._cs.changeLayout(this._gs.defaultLayout);
				}, 2000);
			},
		err => console.log(err))
	this.onClose();
	}

	/****/
	selectLabel: string = "";
	rulesListApiUrl: string = "http://192.168.2.114/vls/get_all_rules_name/";
	RulesList: any = [];
	rulesFlag: boolean = false;
	getRulesInfo() {
		this.selectLabel = "Select Node Rule";
		this.rulesFlag = true;
		this._cs.getWebData(this.rulesListApiUrl, '{"Type":"node"}').subscribe(
			(res) => {			
				this.RulesList = res.Rules
			 },
		   (err) => console.log(err))
	}


	rulesvalue: any = "";
	dataByRulesApiUrl: string = "http://192.168.2.114/vls/get_rule_data/"
	applyRule() {
		this._cs.getWebData(this.dataByRulesApiUrl, '{"Type":"node","Name":"' + this.rulesvalue + '"}').subscribe(
			res => {
				var result = res.Data;
				console.log(res.Data);				
				var nodes = this._gs.cy[this.selected].elements().filter('node').map(item=> item.json())
				var ruleFlag = false;				
				nodes.some((item) => {					
					if (result.condition == 'AND') {
						result.rules.some((rule, i) => {
							if (rule.operator == 'equal') {
								if (item.data[rule.field] == rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] == rule.value && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}
							} else if (rule.operator == 'not equal') {
								if (item.data[rule.field] != rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] != rule.value && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							} else if (rule.operator == 'less') {
								if (item.data[rule.field] < rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] < rule.value && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							} else if (rule.operator == 'less_or_equal') {
								if (item.data[rule.field] <= rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] <= rule.value && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							} else if (rule.operator == 'greater') {
								if (item.data[rule.field] > rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] > rule.value && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'greater_or_equal') {
								if (item.data[rule.field] >= rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] >= rule.value && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'between') {
								if (item.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'not_between') {
								if (item.data[rule.field] < rule.value[0] && item._private.data[rule.field] > rule.value[1] && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}

							else if (rule.operator == 'begins_with') {
								if (item.data[rule.field].indexOf(rule.value) == 0 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].indexOf(rule.value) == 0 && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							} else if (rule.operator == 'not_begins_with') {
								console.log('not_begins_with');
								if (item.data[rule.field].indexOf(rule.value) != 0 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].indexOf(rule.value) != 0 && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'contains') {
								if (item.data[rule.field].match(rule.value) != '' && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].matcg(rule.value) != '' && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'not_contains') {
								if (item.data[rule.field].match(rule.value) == '' && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].match(rule.value) == '' && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'ends_with') {
								if (item.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'ends_with') {
								if (item.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'not_ends_with') {
								if (item.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}

							else if (rule.operator == 'is_empty') {
								if (item.data[rule.field] == "" && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] == "" && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'is_not_empty') {
								if (item.data[rule.field] != "" && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] != "" && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'is_null') {
								if (item.data[rule.field] == null && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] == null && result.rules.length > 1) {
									ruleFlag = true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'is_not_null') {
								if (item.data[rule.field] != null && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] != null && result.rules.length > 1) {
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

								if (item.data[rule.field] == rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] == rule.value && result.rules.length > 1) {
									ruleFlag = true;
									return true;
								} else {
									ruleFlag = false;

								}
							} else if (rule.operator == 'not equal') {
								if (item.data[rule.field] != rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] != rule.value && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							} else if (rule.operator == 'less') {
								if (item.data[rule.field] < rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] < rule.value && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							} else if (rule.operator == 'less_or_equal') {
								if (item.data[rule.field] <= rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] <= rule.value && result.rules.length > 1) {
									ruleFlag = true;
									return true;
								} else {
									ruleFlag = false;

								}


							} else if (rule.operator == 'greater') {
								if (item.data[rule.field] > rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] > rule.value && result.rules.length > 1) {
									ruleFlag = true;
									return true;
								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'greater_or_equal') {
								if (item.data[rule.field] >= rule.value && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] >= rule.value && result.rules.length > 1) {
									ruleFlag = true;
									return true;
								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'between') {
								if (item.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'not_between') {
								if (item.data[rule.field] < rule.value[0] && item._private.data[rule.field] > rule.value[1] && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] >= rule.value[0] && item._private.data[rule.field] <= rule.value[1] && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}

							else if (rule.operator == 'begins_with') {
								if (item.data[rule.field].indexOf(rule.value) == 0 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].indexOf(rule.value) == 0 && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							} else if (rule.operator == 'not_begins_with') {
								console.log('not_begins_with');
								if (item.data[rule.field].indexOf(rule.value) != 0 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].indexOf(rule.value) != 0 && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'contains') {
								if (item.data[rule.field].match(rule.value) != '' && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].matcg(rule.value) != '' && result.rules.length > 1) {
									ruleFlag = true;
									return true;
								} else {
									ruleFlag = false;
								}


							}
							else if (rule.operator == 'not_contains') {
								if (item.data[rule.field].match(rule.value) == '' && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].match(rule.value) == '' && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'ends_with') {
								if (item.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].indexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'ends_with') {
								if (item.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].lastIndexOf(rule.value) == item._private.data[rule.field].length - 1 && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'not_ends_with') {
								if (item.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field].lastIndexOf(rule.value) != item._private.data[rule.field].length - 1 && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}

							else if (rule.operator == 'is_empty') {
								if (item.data[rule.field] == "" && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] == "" && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;
									return true;
								}


							}
							else if (rule.operator == 'is_not_empty') {
								if (item.data[rule.field] != "" && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] != "" && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'is_null') {
								if (item.data[rule.field] == null && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] == null && result.rules.length > 1) {
									ruleFlag = true;
									return true;

								} else {
									ruleFlag = false;

								}


							}
							else if (rule.operator == 'is_not_null') {
								if (item.data[rule.field] != null && result.rules.length == 1) {
									ruleFlag = true;
								} else if (item.data[rule.field] != null && result.rules.length > 1) {
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
		this.onClose();
	}

}
