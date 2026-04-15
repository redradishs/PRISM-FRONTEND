import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // apiUrl = 'https://prismapi2.onrender.com/admin'
  // apiUrl = 'https://api.prismgcccs.live/admin'
  apiUrl = 'https://vps.prismgcccs.app/admin'

  // apiUrl = 'http://localhost:8000/admin'


  constructor(private http: HttpClient) { }

  //dashboard

  getBasicData() {
    return this.http.get(`${this.apiUrl}/getData`);
  }

  getDBData() {
    return this.http.get(`${this.apiUrl}/dbData`);
  }

  getRecentActivities() {
    return this.http.get(`${this.apiUrl}/recentacts`)
  }


  //usermanagement
  getAllUsers(role: string, limit: number, program: string, page: number, status?: string, isBanned?: boolean) {
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
    if (isBanned === true) {
      params.isBanned = isBanned.toString();
    }
    return this.http.get(`${this.apiUrl}/userlist`, { params });
  }

  searchAllUsers(role: string, limit: number, program: string, page: number, search: string, status?: string, isBanned?: boolean) {
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
    if (isBanned === true) {
      params.banned = isBanned.toString();
    }
    return this.http.get(`${this.apiUrl}/userSearch`, { params });
  }

  banUser(userId: string, data: any) {
    return this.http.put(`${this.apiUrl}/users/${userId}/ban`, data);
  }

  unbanUser(userId: string) {
    return this.http.put(`${this.apiUrl}/users/${userId}/unban`, {});
  }

  resetUserPassword(userId: string, data: any) {
    return this.http.put(`${this.apiUrl}/users/${userId}/reset-password`, data);
  }


  getStudentReports(queryParams: any) {
    const params = new URLSearchParams();

    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        params.append(key, queryParams[key].toString());
      }
    });

    return this.http.get(`${this.apiUrl}/reports/allreport?${params.toString()}`);
  }

  reviewReport(data: any) {
    return this.http.post(`${this.apiUrl}/reports/review`, data);
  }


  reviewReportStats() {
    return this.http.get(`${this.apiUrl}/reports/stats`);
  }



  //system setting

  getSystemSettings() {
    return this.http.get(`${this.apiUrl}/system-settings`);
  }

  updateSystemSettings(data: any) {
    return this.http.put(`${this.apiUrl}/system-settings`, data);
  }

  resetSettings() {
    return this.http.post(`${this.apiUrl}/system/reset`, {});
  }

}
