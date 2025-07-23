import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  apiUrl = 'https://prismapi2.onrender.com/admin'
  // apiUrl = 'http://localhost:8000/admin'


  constructor(private http: HttpClient) { }

  //dashboard

  getBasicData() {
    return this.http.get(`${this.apiUrl}/getData`);
  }

  getDBData() {
    return this.http.get(`${this.apiUrl}/dbData`);
  }


  //usermanagement
  getAllUsers(role: string, limit: number, program: string, page: number, status?: string) {
    const params: any = { limit: limit.toString(), page: page.toString() };
    if (role && role !== 'all') {
      params.role = role;
    }
    if (program && program !== 'all') {
      params.program = program;
    }
    if (status && status !== 'all') {
      params.status = status;
    }
    return this.http.get(`${this.apiUrl}/userlist`, { params });
  }

  searchAllUsers(role: string, limit: number, program: string, page: number, search: string, status?: string,) {
    const params: any = { limit: limit.toString(), page: page.toString(), search };
    if (role && role !== 'all') {
      params.role = role;
    }
    if (program && program !== 'all') {
      params.program = program;
    }
    if (status && status !== 'all') {
      params.status = status;
    }
    return this.http.get(`${this.apiUrl}/userSearch`, { params });
  }


}
