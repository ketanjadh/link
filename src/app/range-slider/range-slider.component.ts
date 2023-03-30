import { Component, OnInit } from '@angular/core';
import * as Plotly from 'plotly.js/dist/plotly.js';
import { GraphService } from '../shared/graph.service';
import * as jslinq from "jslinq";
@Component({
    selector: 'app-range-slider',
    templateUrl: './range-slider.component.html',
    styleUrls: ['./range-slider.component.scss']
})
export class RangeSliderComponent implements OnInit {

    selected: any;
    sliderDataArr: any = [];
    graphDataArray: any = [];
    selectedTimelineAttr: any = '';

    constructor(public grphservice: GraphService) {
        this.grphservice.cyIndex.subscribe(res => this.selected = res);
        this.grphservice.dataArr.subscribe(res => this.graphDataArray = res);
        this.grphservice.timelineAttrVal.subscribe(res => this.selectedTimelineAttr = res);
    }

    ngOnInit(): void {
        this.grphservice.sliderDataArr.subscribe(res => {
            if (res.length) {
                this.sliderDataArr = res;
                this.initRangeSlider(this.sliderDataArr, this.graphDataArray, this.selectedTimelineAttr, this.grphservice);
            }
        })
        this.grphservice.isSliderNavigated.subscribe(res => {
            if (res) {
                this.selectAndDeselectNodeOnNavigateSlider();
            }
        });
    }

    /**SELECT OR DESELECT GRAPH NODE WHEN RANGE SLIDER NAVIGATE**/
    selectAndDeselectNodeOnNavigateSlider() {
        let allNodes = this.graphDataArray.map(item => item.data.id);
        this.grphservice.notSelectedNodes = allNodes.filter(item => this.grphservice.selectedIds.indexOf(item) < 0);
        this.selectAndDeselect(this.grphservice.selectedIds, this.grphservice.notSelectedNodes);
    }

    /**SELECT/DESELECT**/
    selectAndDeselect(selected, notselected) {
        this.grphservice.selectedIds = [];
        selected.forEach(item => {
            this.grphservice.cy[this.selected].$(`#${item}`).select();
            this.grphservice.selectedIds.push(item);
        });
        this.grphservice.notSelectedNodes = [];
        notselected.forEach(item => {
            this.grphservice.cy[this.selected].$('#' + item).deselect();
            this.grphservice.notSelectedNodes.push(item);
        });
    }

    /**INIT RANGE SLIDER**/
    initRangeSlider(sliderdata, graphdata, timelineAttr, graphService) {
        let timerId = 0;
        let plotlyRelayoutEventFunction = function (eventdata) {
            if (Object.prototype.toString.call(eventdata["xaxis.range"]) === '[object Array]') {
                let nodesArr = graphdata.filter(item => item.group == 'nodes');
                let queryObj = jslinq(nodesArr);
                let result = queryObj.where(function (el: any) {
                    let startRange: any = parseInt((new Date(eventdata["xaxis.range"][0]).getTime() / 1000).toFixed(0))
                    let endRange: any = parseInt((new Date(eventdata["xaxis.range"][1]).getTime() / 1000).toFixed(0))
                    return el.data[timelineAttr] >= startRange && el.data[timelineAttr] <= endRange;
                }).toList();
                let selectedItems: any = []
                result.forEach((itemData: any) => {
                    selectedItems.push(itemData.data.id)
                });
                if (timerId >= 0) {
                    //timer is running: stop it
                    window.clearTimeout(timerId);
                }
                timerId = window.setTimeout(function () {
                    //rangeslider event ENDS
                    graphService.selectedIds = selectedItems;
                    graphService.isSliderNavigated.next(true);
                    timerId = -1;
                }, 800);
            }
        }
        const xField = 'date';
        const yField = 'count';
        const selectorOptions = {};
        let layout = {
            title: 'Time series with range slider and selectors',
            xaxis: {
                rangeselector: selectorOptions,
                rangeslider: {}
            },
            yaxis: {
                fixedrange: true
            }
        };

        let finaldata = prepData(sliderdata);
        Plotly.plot('graph', finaldata, layout, { showSendToCloud: true });
        (document.getElementById('graph') as any).on('plotly_relayout', plotlyRelayoutEventFunction);
        function prepData(graphdata) {
            let data = graphdata.sort(sortbydate)
            var x = [];
            var y = [];
            data.forEach((datum, i) => {
                //if(i % 100) return;
                x.push(new Date(datum[xField]));
                y.push(datum[yField]);
            });
            return [{
                mode: 'lines',
                x: x,
                y: y
            }];
        }
        function sortbydate(a, b) {
            if (a["date"] < b["date"]) {
                return -1;
            } else if (a["date"] > b["date"]) {
                return 1;
            }
            return 0;
        }
    }

}
