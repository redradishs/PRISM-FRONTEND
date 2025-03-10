import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  apiUrl = 'https://prismapi2.onrender.com/student'

  constructor(private http: HttpClient) { }

  //dashboad page
  getDashboardData(id: string) {
    return this.http.get(`${this.apiUrl}/statistics/${id}`)
  }
}
