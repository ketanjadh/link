import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class CommonService {

  constructor(private http:HttpClient) { }
  headers = new HttpHeaders({'Content-Type':'application/json; charset=utf-8'});
    
  isHideDialog:any = new BehaviorSubject(false);

  getData(url):Observable<any>{
    return this.http.get<any>(url);
  }

  getStyle(url):Observable<any>{
    return this.http.get(url);
  }

getWebData(body:{}, url:any):Observable<any>{
    let headers = new HttpHeaders()
    .set('content-type', 'application/json')
    .set('Access-Control-Allow-Origin', '*');
    return this.http.post<any>(url, body, {'headers': headers});
  }
    

}
