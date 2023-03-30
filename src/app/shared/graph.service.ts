import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
 private dataApiUrl:any='http://localhost:3001/data';
 //private styleApiUrl:any='http://localhost:3001/style';
 private styleApiUrl: any = 'http://192.168.2.94:8080/style.json';
 public dataArr:any= new BehaviorSubject([]);
 public styleArr:any=[];
 public cy:any = {};
 public tabs = ['Main'];
 public layoutName:any='spread';
 public defaultLayout:any="fcose"
 public selectedIds:any=[];
 public selectedItems:any = []; 
 public isSelected:boolean = false;
 public clipDataArr:any=[];
 public cyIndex = new BehaviorSubject(0)
 public bgImage = new BehaviorSubject('');
 public detectItemSection = new BehaviorSubject(false);  
 public showDeg: boolean = false;
 public nodesLabel: any = [];
 public centralNodes: any = [];
 public isCentralNodeSel: boolean = false;
 public layoutAnim:boolean = true;
 public notSelectedNodes: any = [];
 public naviGat:any;
 public nodeBgImg:any='';
 public createNodeRuleModalFlag:boolean=false;
 public manageNodeRuleModalFlag:boolean=false;

 public leaveflag: boolean = true
 public flagActiveNeighbours: boolean = false;
 public navigatorFlag: boolean = false;
 public activeIndex:number = null;
 public explodeNodeIds:any='';
 public selectedGraphId: any=0;
 public labelData:any=[];
 public isResetgraph = false;

 

  public nodeLabel: any;
  public selectedNodeVal: any;
  public nodeAllAtributes: any = [];
  public nodeDefaultShowProperty: any = 'id';
  public sourceNode: any;
  public targetNode: any;
  public edgeDefaultShowProperty: any = 'id';
  public timelineAttrVal:any = new BehaviorSubject('ClosedDateTime')
  public nodeDataMap = new Map();
  public nodeRuleIconList:any = [];
  public selectedRuleIcon:any='';

 public selectedNodesBg:any = "";
 public verTicsDataArr:any= [];

 public sliderDataArr:any= new BehaviorSubject([]);
 public timelineAttr:any = new BehaviorSubject('');
 public isSliderNavigated:any = new BehaviorSubject(false);
 
 public isSubgraphReady = new BehaviorSubject<boolean>(false)


constructor(private http:HttpClient) { }
 headers = new HttpHeaders({'Content-Type':'application/json; charset=utf-8'})
          .set('Access-Control-Allow-Origin', '*');
 
  getData():Observable<any>{
    return this.http.get<any>(this.dataApiUrl);
  }

  getStyle():Observable<any>{
    return this.http.get(this.styleApiUrl, {headers:this.headers});
  }

  

//  private newForgeQueryBody:any = {"query":"Match (p)-[r]-(n) where ID(p) IN [38425] return p,r,n"}
//  private newForgeQueryBody:any = {"query":"match(n:pcrevents) return n limit 200"}
 private newForgeQueryBody:any = {"query":"Match (p)-[r]-(n) where ID(p) IN [9437905, 9437976, 9437977, 9437978, 9437999, 9438000] return p,r,n"}
  
  
  
  private webApiUrl:any = 'http://192.168.2.114/neoapi/fetchDetails/'
  getWebData():Observable<any>{
    let headers = new HttpHeaders()
    .set('content-type', 'application/json')
    .set('Access-Control-Allow-Origin', '*');
    return this.http.post<any>(this.webApiUrl, this.newForgeQueryBody, {'headers': headers});
  }

  //private labelApiUrl:any = 'http://192.168.2.94:8080/label-style.json';
   private labelApiUrl:any = 'http://192.168.2.114/vls/style_change/';
  getLabelData():Observable<any>{
    let headers = new HttpHeaders()
    .set('content-type', 'application/json')
    .set('Access-Control-Allow-Origin', '*');
    return this.http.get<any>(this.labelApiUrl, {'headers': headers});
  }
  
  private histogramApiUrl:any = 'http://192.168.2.114/misc/getHistogram/';
  getHistogramData():Observable<any>{
    let headers = new HttpHeaders()
    .set('content-type', 'application/json')
    .set('Access-Control-Allow-Origin', '*');
    return this.http.get<any>(this.histogramApiUrl, {'headers': headers});
  }

}
