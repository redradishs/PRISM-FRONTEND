import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface AIPromptRequest {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  // Define the structure of the response from the API
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // apiUrl = 'http://localhost:8000/api';
  apiUrl = 'https://prismcdn.onrender.com/api';
  aiUrl = 'https://redprismai.vercel.app'

  constructor(private http: HttpClient) { }

  // The AI CONTENT GENERATION STARTS HERE

  // Basic assessment generation
  generateAssessment(content: string) {
    const data: AIPromptRequest = {
      role: 'system',
      content: content
    };
    return this.http.post(`${this.aiUrl}/instructor`, data);
  }

  // Enhanced assessment with additional parameters
  generateAssessmentPlus(content: string) {
    const data: AIPromptRequest = {
      role: 'system',
      content: content
    };
    return this.http.post(`${this.aiUrl}/instructorplus`, data);
  }

  // Generate assessment with specific topic
  generateTopicAssessment(topic: string, additionalInstructions: string = '') {
    const content = `Generate an assessment for ${topic}. ${additionalInstructions}`;
    return this.generateAssessment(content);
  }

  // Generate quiz assessment
  generateQuizAssessment(numberOfQuestions: number, difficulty: 'easy' | 'medium' | 'hard', topic: string) {
    const content = `Generate a ${difficulty} quiz with ${numberOfQuestions} questions about ${topic}`;
    return this.http.post<AIResponse>(`${this.aiUrl}/instructorplus`, {
      role: 'system',
      content: content
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
    return this.http.get(`${this.apiUrl}/getInstructorTotalActiveAssessments/${id}`);
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

  getOwnAssessments(id: string){
    return this.http.get(`${this.apiUrl}/getMyAssessments/${id}`);
  }
  
  //result page instructor 

  getClassOverview(id: string){
    return this.http.get(`${this.apiUrl}/getAssessmentResult/${id}`);
  }

  getQuestionAnalysis(id: string) {
    return this.http.get(`${this.apiUrl}/getQuestionAnalysis/${id}`);
  }

  getTopandLowPerformers(id: string) {
    return this.http.get(`${this.apiUrl}/rankStudentAssessment/${id}`);
  }

  getClassScore(id: string) {
    return this.http.get(`${this.apiUrl}/getClassScoreResult/${id}`);
  }


  

}
