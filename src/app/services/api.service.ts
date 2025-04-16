import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface AIPromptRequest {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  // Define the structure of the response from the API
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // apiUrl = 'http://localhost:8000/api';
  // apiUrl = 'https://prismcdn.onrender.com/api';
  apiUrl = 'https://prismapi2.onrender.com/instructor';
  aiUrl = 'https://redprismai.vercel.app';

  constructor(private http: HttpClient) {}

  // The AI CONTENT GENERATION STARTS HERE

  // Basic assessment generation
  generateAssessment(content: string) {
    const data: AIPromptRequest = {
      role: 'system',
      content: content,
    };
    return this.http.post(`${this.aiUrl}/instructor`, data);
  }

  // Enhanced assessment with additional parameters
  generateAssessmentPlus(content: string) {
    const data: AIPromptRequest = {
      role: 'system',
      content: content,
    };
    return this.http.post(`${this.aiUrl}/instructorplus`, data);
  }

  // Generate assessment with specific topic
  generateTopicAssessment(topic: string, additionalInstructions: string = '') {
    const content = `Generate an assessment for ${topic}. ${additionalInstructions}`;
    return this.generateAssessment(content);
  }

  // Generate quiz assessment
  generateQuizAssessment(
    numberOfQuestions: number,
    difficulty: 'easy' | 'medium' | 'hard',
    prompt: string
  ) {
    return this.http.post<AIResponse>(`${this.aiUrl}/instructorplus`, {
      role: 'system',
      content: prompt,
    });
  }

  // Generate performance evaluation
  generatePerformanceEvaluation(studentData: string) {
    const content = `Analyze and evaluate the following student performance data: ${studentData}`;
    return this.generateAssessmentPlus(content);
  }

  // The AI CONTENT GENERATION ENDS HERE

  //normal api calls here, starts with dashboard
  getInstructorTotalStudents(id: string) {
    return this.http.get(`${this.apiUrl}/getInstructorTotalStudents/${id}`);
  }

  getActiveAssessments(id: string) {
    return this.http.get(
      `${this.apiUrl}/getInstructorTotalActiveAssessments/${id}`
    );
  }

  getTotalClassess(id: string) {
    return this.http.get(`${this.apiUrl}/getTotalClasses/${id}`);
  }

  getOngoingAssessments(id: string) {
    return this.http.get(`${this.apiUrl}/getOnGoingAssessments/${id}`);
  }

  //  starts with generateAssessmentPage

  createAssessment(data: any) {
    return this.http.post(`${this.apiUrl}/createAssessment`, data);
  }

  //students page

  approve(data: any) {
    return this.http.post(`${this.apiUrl}/approve`, data);
  }

  studentList(id: string, classCode: string, page: number = 1, pageSize: number = 20) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
      
    return this.http.get(`${this.apiUrl}/classes/student/list/${id}/${classCode}`, { params });
  }

  assignedAssessments(id: string, classCode: string, page: number = 1, pageSize: number = 10) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
      
    return this.http.get(`${this.apiUrl}/classes/stats/assigned/assessments/${id}/${classCode}`, { params });
  }

  ownedClasses(id: string) {
    return this.http.get(`${this.apiUrl}/classes/owned/${id}`);
  }

  statsClass(id: string, classCode: string) {
    return this.http.get(`${this.apiUrl}/classes/stats/${id}/${classCode}`);
  }

  searchAssessment(id: string, classCode: string, text: string, page: number = 1, pageSize: number = 10) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
    return this.http.get(`${this.apiUrl}/classes/assessments/search/${id}/${classCode}?query=${text}`);
  }

  searchStudents(id: string, classCode: string, text: string, page: number = 1, pageSize: number = 10) {
    let params = new HttpParams()
    .set('page', page.toString())
    .set('limit', pageSize.toString());
    return this.http.get(`${this.apiUrl}/classes/students/search/${id}/${classCode}?query=${text}`);
  }


  getOwnAssessment(id: string){
    return this.http.get(`${this.apiUrl}/classes/assessment/latest/${id}`);
  }

  searchAssessmentUser(id: string, text: string, page: number = 1, pageSize: number = 10) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());
    return this.http.get(`${this.apiUrl}/search/assessment/own/${id}?query=${text}`);
  }

  searchStudentsAdd(id: string, classCode: string, text: string) {
    return this.http.get(`${this.apiUrl}/classes/student/search/add/${id}/${classCode}?query=${text}`);
  }

  classSettings(id: string, data: any) {
    return this.http.put(`${this.apiUrl}/class/settings/${id}`, data);
  }

  addStudent(id: string, classCode: string, data: any) {
    return this.http.post(`${this.apiUrl}/class/addstudent/${id}/${classCode}`, data);
  }

  removeStudent(id: string, classCode: string, data: any){
    return this.http.put(`${this.apiUrl}/class/removeStudent/${id}/${classCode}`, data);
  }



  // Student assessment page

  getInstructorClasses(id: string) {
    return this.http.get(`${this.apiUrl}/getDetailedClasses/${id}`);
  }

  getAllDetails(id: string) {
    return this.http.get(`${this.apiUrl}/class-students/${id}`);
  }

  getAssessments(id: string) {
    return this.http.get(`${this.apiUrl}/getAssessments/${id}`);
  }

  getOwnAssessments(id: string) {
    return this.http.get(`${this.apiUrl}/getMyAssessments/${id}`);
  }

  getSpecifiedClasses(id: string) {
    return this.http.get(`${this.apiUrl}/getInstructorClasses/${id}`);
  }

  assignAssessment(data: any) {
    return this.http.post(`${this.apiUrl}/assign`, data);
  }

  createClass(data: any) {
    return this.http.post(`${this.apiUrl}/create`, data);
  }

  //result page instructor

  getClassOverview(id: string) {
    return this.http.get(`${this.apiUrl}/assessment/result/data/${id}`);
  }

  getQuestionAnalysis(id: string) {
    return this.http.get(`${this.apiUrl}/assessment/result/analysis/${id}`);
  }

  getTopandLowPerformers(id: string) {
    return this.http.get(`${this.apiUrl}/assessment/result/rank/${id}`);
  }

  getClassScore(id: string) {
    return this.http.get(`${this.apiUrl}/assessment/result/score/${id}`);
  }

  //profile page instructor
  getTeachingSummary(id: string) {
    return this.http.get(`${this.apiUrl}/instructorstats/${id}`);
  }
}
