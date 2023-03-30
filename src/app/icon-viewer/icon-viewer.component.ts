import { Component, OnInit } from '@angular/core';
import { CommonService } from '../shared/common.service';
import { GraphService } from '../shared/graph.service';

@Component({
  selector: 'app-icon-viewer',
  templateUrl: './icon-viewer.component.html',
  styleUrls: ['./icon-viewer.component.scss']
})
export class IconViewerComponent implements OnInit {
  iconList: any = []
  selectedIcon: number = null
  constructor(public grphservice: GraphService, private service: CommonService) { }

  ngOnInit(): void {
  }


  selectImageIcon(imgPath, index) {
    this.selectedIcon = index;
    this.grphservice.selectedRuleIcon = imgPath;
  }

  reset() {
    this.grphservice.selectedRuleIcon = '';
    this.selectedIcon = null;
  }


  iconListApiUrl: string = "http://192.168.2.114/vls/get_all_icon/";
  searchIcon(serachVal) {
    this.grphservice.nodeRuleIconList = [];
    this.service.getWebData(this.iconListApiUrl, '{"Label":"' + serachVal.value + '"}').subscribe(
      (res) => {
        console.log(res)
        for (var key in res) {
          this.grphservice.nodeRuleIconList.push(res[key]);
        }
      },
      (err) => console.log(err))
  }


}
