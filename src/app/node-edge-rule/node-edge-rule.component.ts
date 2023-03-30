import { AfterViewInit, Component} from '@angular/core';
import { GraphService } from '../shared/graph.service';
import { CommonService } from '../shared/common.service';
import { AbstractControl, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { IconViewerComponent } from '../icon-viewer/icon-viewer.component';
import { ThemePalette } from '@angular/material/core';
declare var $: any;

@Component({
	selector: 'app-node-edge-rule',
	templateUrl: './node-edge-rule.component.html',
	styleUrls: ['./node-edge-rule.component.scss']
})
export class NodeEdgeRuleComponent implements AfterViewInit {
	public disabled = false;
	colorCtr: AbstractControl = new FormControl(null);
	public color: ThemePalette = 'primary';
	public touchUi = false;

	selected: any;
	myControl = new FormControl();
	options: string[] = [];
	filteredOptions: Observable<string[]>;

	ngOnInit() {
		this.filteredOptions = this.myControl.valueChanges.pipe(
			startWith(''),
			map(value => this._filter(value))
		);
	}

	private _filter(value: string): string[] {
		const filterValue = value.toLowerCase();
		return this.options.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
	}


	allOperators = [
		{ "equal": "==" },
		{ "not_equal": "!=" },
		{ "in": "" },
		{ "not_in": "" },
		{ "begins_with": "" },
		{ "not_begins_with": "" },
		{ "contains": "" },
		{ "not_contains": "" },
		{ "ends_with": "" },
		{ "not_ends_with": "" },
		{ "is_empty": "" },
		{ "is_not_empty": "" },
		{ "is_not_empty": "" },
		{ "is_null": "" },
		{ "is_not_null": "" }
	]

	constructor(
		public grphservice: GraphService,
		private service: CommonService,
		private dialog: MatDialog) {
		this.grphservice.cyIndex.subscribe(res => {
			this.selected = res;
		});
	}




	ngAfterViewInit() {
		//this.getQueryBuilder();
		this.getNodesRulesInfo();
		this.getAllNodeLabels();
	}

	private getQueryBuilder() {
		$('#builder').queryBuilder({
			plugins: [],

			filters: [{
				id: 'id',
				label: 'ID',
				type: 'string'
			}, {
				id: 'number_id',
				label: 'Number',
				type: 'integer',

			}, {
				id: 'name',
				label: 'Name',
				type: 'string'

			}]
			// rules: this.rules_basic
		});
	}



	selectLabel: string = "";
	rulesListApiUrl: string = "http://192.168.2.114/vls/get_all_rules_name/";
	RulesList: any = [];
	getNodesRulesInfo() {
		this.service.getWebData(this.rulesListApiUrl, '{"Type":"node"}').subscribe(
			(res) => {
				this.RulesList = res.Rules
			},
			(err) => console.log(err))
	}


	allLabelsApiUrl: string = "http://192.168.2.114/vls/get_all_labels/";
	lablesList: any = [];
	getAllNodeLabels() {
		this.service.getData(this.allLabelsApiUrl).subscribe(
			(res) => {
				this.options = res.Data;
				this.options.sort();

			},
			(err) => console.log(err))

	}

	rulesValue: any = "";
	dataByRulesApiUrl: string = "http://192.168.2.114/vls/get_rule_data/"
	getRuleInfoDetails() {
		this.service.getWebData(this.dataByRulesApiUrl, '{"Type":"node","Name":"' + this.rulesValue + '"}').subscribe(
			res => {
				console.log(res.Data);
				(document.getElementById("node-label-id") as HTMLInputElement).value = res.Data.nodeLabel;
				this.getLabelFiltersDetails(res.Data.nodeLabel);
				(document.getElementById("label-foreground-id") as HTMLInputElement).value = res.Data.labelforeground;
				(document.getElementById("icon-id") as HTMLInputElement).value = res.Data.icon;
				setTimeout(() => {
					$('#builder').queryBuilder('setRules', res.Data);
				}, 1000);

			},
			err => console.log(err))
	}


	attributesDataByLabelApiUrl: string = "http://192.168.2.114/vls/get_label_data/"
	getLabelFiltersDetails(labelVal) {
		//$('#builder').queryBuilder('destroy');
		this.service.getWebData(this.attributesDataByLabelApiUrl, '{"Label":"' + labelVal + '"}').subscribe(
			res => {
				let filterData: any = [];
				let labelArray = res["Data"];
				for (var key in labelArray) {
					if (labelArray[key] == "STRING")
						filterData.push({ "id": key, "label": key, "type": "string" });
				}

				$('#builder').queryBuilder({ plugins: [], filters: filterData });


			},
			err => console.log(err))


	}

	createNodeRule() {
		var result = $('#builder').queryBuilder('getRules');	
		if(!$.isEmptyObject(result)) {
			Object.assign(result, {
				"nodeRulename": (document.getElementById("node-rule-name-id") as HTMLInputElement).value,
				"nodeLabel": (document.getElementById("node-label-id") as HTMLInputElement).value,
				"labelforeground": (document.getElementById("label-foreground-id") as HTMLInputElement).value,
				"icon": (document.getElementById("icon-id") as HTMLInputElement).value,
				"is-default": (document.getElementById("checkID") as HTMLInputElement).value
			});
			this.service.getWebData('http://192.168.2.114/vls/create_rule/', result).subscribe(res => {
				if (res.Status) {
					alert('Node Rule has been created successfully.');
					this.service.isHideDialog.next(true);
				}
			},
				err => console.log(err));
		}
	}

	updateNodeRule() {
		var result = $('#builder').queryBuilder('getRules');
		if (!$.isEmptyObject(result)) {
			Object.assign(result, {
				"nodeRulename": (document.getElementById("node-rule-name-id") as HTMLInputElement).value,
				"nodeLabel": (document.getElementById("node-label-id") as HTMLInputElement).value,
				"labelforeground": (document.getElementById("label-foreground-id") as HTMLInputElement).value,
				"icon": (document.getElementById("icon-id") as HTMLInputElement).value,
				"is-default": (document.getElementById("checkID") as HTMLInputElement).value
			});
			console.log(result);
			this.service.getWebData('http://192.168.2.114/vls/update_node_rule/', result).subscribe(res => {
				console.log(res);
				if (res.Status) {
					alert('Node Rule has been updtaed successfully.');
					this.service.isHideDialog.next(true);
				}
			},
				err => console.log(err))

		}


	}


	deleteNodeRule() {
		let result: any = {};
		Object.assign(result, {
			"Name": (document.getElementById("node-rule-name-id") as HTMLInputElement).value,
			"Type": "node"
		});
		console.log(result);
		this.service.getWebData('http://192.168.2.114/vls/delete_node_rule/', result).subscribe(res => {
			console.log(res);
			if (res.Status) {
				alert('Node Rule has been Deleted successfully.');
				this.service.isHideDialog.next(true);
			}
		},
			err => console.log(err))

	}




	createEdgeRule() {
		var result = $('#builder').queryBuilder('getRules');
		if (!$.isEmptyObject(result)) {
			Object.assign(result, {
				"edgeRulename": (document.getElementById("edge-rule-name-id") as HTMLInputElement).value,
				"edgeLabel": (document.getElementById("edge-label-id") as HTMLInputElement).value,
				"labelforeground": (document.getElementById("label-foreground-id") as HTMLInputElement).value,
				"icon": (document.getElementById("icon-id") as HTMLInputElement).value,
				"is-default": (document.getElementById("checkID") as HTMLInputElement).value
			});
			this.service.getWebData('http://192.168.2.114/vls/create_rule/', result).subscribe(res => {
				console.log(res);
				if (res.Status) {
					alert('Edge Rule has been created successfully.');
				}

			},
				err => console.log(err))

		}
	}

	getRule() {
		var result = $('#builder').queryBuilder('getRules');
		var attributesArr = ['id', 'name', 'label'];
		var objVar = "item._private.data.";
		var finalRule = '';
		var ruleArr = [];
		if (!$.isEmptyObject(result)) {
			Object.assign(result, {
				"nodeRulename": (document.getElementById("node-rule-name-id") as HTMLInputElement).value,
				"nodeLabel": (document.getElementById("node-label-id") as HTMLInputElement).value,
				"labelforeground": (document.getElementById("label-foreground-id") as HTMLInputElement).value,
				"icon": (document.getElementById("icon-id") as HTMLInputElement).value,
				"is-default": (document.getElementById("checkID") as HTMLInputElement).value
			});		
			console.log(JSON.stringify(result));			
			var nodes = this.grphservice.cy[this.selected].elements().filter('node');
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



						/*	 if(item._private.data[rule.field]==rule.value && result.rules.length==1){
								 ruleFlag=true;
							  
						 }else if(item._private.data[rule.field]==rule.value && result.rules.length>1){
							ruleFlag=true;
							return true;
				
						}else{
						ruleFlag=false;
						}*/
					});
				}





				if (ruleFlag) {
					console.log('inside');
					this.grphservice.cy[this.selected].$('#' + item.id()).style({
						"background-image": result.icon,
						"text-outline-color": result.labelforeground

					});

					// return true;
				}
				//console.log(finalRule);

			});

		}
		else {
			console.log("invalid object :");
		}
	}

	setRule() {
		var result = $('#builder').queryBuilder('getRules');
		console.log(result);
		if (!$.isEmptyObject(result)) {
			// this.rules_basic = result;
		}
	}

	resetRule() {
		$('#builder').queryBuilder('reset');
	}





	uploadimage: boolean = false;
	iconListApiUrl: string = "http://192.168.2.114/vls/get_all_icon/";
	createImageIcon() {
		this.service.getWebData(this.iconListApiUrl,'{"Label":""}').subscribe(
			(res) => {
				for (var key in res) {
					this.grphservice.nodeRuleIconList.push(res[key]);
				}
				this.opeIconDialg();
			},
			(err) => console.log(err))
		this.uploadimage = true;
	}

	opeIconDialg() {
		let dialogRef = this.dialog.open(IconViewerComponent, { panelClass: 'node_edge_rule' });
		dialogRef.afterClosed().subscribe(res => {
			if (res) this.grphservice.nodeRuleIconList = [];
		})
	}




}