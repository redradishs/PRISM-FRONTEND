import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  apiUrl = 'https://prismapi2.onrender.com/student';
  Assessment = 'https://prismapi2.onrender.com/submission';
  // apiUrl = 'http://localhost:8000/student';
  // Assessment = 'http://localhost:8000/submission';


  constructor(private http: HttpClient) {}

  //dashboad page
  getDashboardData(id: string) {
    return this.http.get(`${this.apiUrl}/statistics/${id}`);
  }

  //conformation page
  getConfirmationData(data: any) {
    return this.http.post(`${this.apiUrl}/assessmentConfirmation`, data);
  }
  recordStartTime(data: any) {
    return this.http.post(`${this.apiUrl}/recordStartTime`, data);
  }

  joinClass(data: any) {
    return this.http.post(`${this.apiUrl}/joinClass`, data)
  }

  joinPublicAssessment(joiningCode: string, studentId: string) {
    return this.http.post(`${this.apiUrl}/joinPublicAssessment/${joiningCode}`, { studentId });
  }

  //Assessment Take Page

  getAssessmentData(id: string, studentId: string) {
    return this.http.get(
      `${this.apiUrl}/assessmentQuestions/${id}/${studentId}`
    );
  }

  submitAssessment(data: any) {
    return this.http.post(`${this.apiUrl}/submitAssessment`, data);
  }


  //Assessment Secure Page
  getSecureData(studentId: String, AssessmentId: string) {
    return this.http.get(`${this.Assessment}/assessment/progress/${studentId}/${AssessmentId}/data`);
  }

  nextQuestionGrabber(assessmentId: string, studentId: string) {
    return this.http.get(`${this.Assessment}/assessment/question/${assessmentId}/${studentId}/next`);
  }

  submitAnswer(data: any) {
    return this.http.post(`${this.Assessment}/assessment/push`, data);
  }

  finalizeAssessment(studentId: string, assessmentId: string) {
    return this.http.post(`${this.Assessment}/assessment/${studentId}/${assessmentId}/finalize`, {});
  }

  //result page
  getResultData(assessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/result/${assessmentId}/${studentId}`);
  }
  getPerformanceData(assessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/performance/${assessmentId}/${studentId}`);
  }
  getQuestionOverview(assessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/review/${assessmentId}/${studentId}`);
  }

  //Student History Page

  totalAssessments(studentId: String) {
    return this.http.get(`${this.apiUrl}/assessmentCounts/${studentId}/data`);
  }

  allAssessments(studentId: String, page: number, limit: number) {
    return this.http.get(`${this.apiUrl}/assessments/${studentId}/all?page=${page}&limit=${limit}`);
  }

  scheduledAssessments(studentId: String, page: number, limit: number) {
    return this.http.get(`${this.apiUrl}/assessments/${studentId}/scheduled?page=${page}&limit=${limit}`);
  }

  ongoingAssessments(studentId: String, page: number, limit: number) {
    return this.http.get(`${this.apiUrl}/assessments/${studentId}/ongoing?page=${page}&limit=${limit}`);
  }

  completedAssessments(studentId: String, page: number, limit: number) {
    return this.http.get(`${this.apiUrl}/assessments/${studentId}/completed?page=${page}&limit=${limit}`);
  }

  searchAssessments(studentId: String, query: string, page: number, limit: number) {
    return this.http.get(`${this.apiUrl}/assessments/${studentId}/search?q=${query}&page=${page}&limit=${limit}`);
  }
  

  //CLASSES PAGE

  classesStats(studentId: string) {
    return this.http.get(`${this.apiUrl}/classes/${studentId}/stats`);
  }

  joinedClasses(studentId: string, page: number, limit: number) {
    return this.http.get(`${this.apiUrl}/joinedClasses/${studentId}/?page=${page}&limit=${limit}`);
  }

  pendingApplications(studentId: string, page: number, limit: number) {
    return this.http.get(`${this.apiUrl}/pendingApplications/${studentId}/?page=${page}&limit=${limit}`);
  }

  cancelApplication(data: any) {
    return this.http.post(`${this.apiUrl}/cancelApplication`, data);
  }

  exitClass(data: any) {
    return this.http.post(`${this.apiUrl}/exitClass`, data);
  }

  

  

  


}
