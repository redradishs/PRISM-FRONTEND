import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface AIPromptRequest {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // rtUrl = 'http://localhost:8000/rt';
  // aiUrl = 'http://localhost:3000';
  // apiUrl = 'http://localhost:8000/instructor';

  // aiUrl = 'https://redprismai.vercel.app';
  // rtUrl = 'https://prismapi2.onrender.com/rt';
  // apiUrl = 'https://prismapi2.onrender.com/instructor';

  //AI Routes 
  aiFinal = 'https://prism-ai-worker.asherjamesmayson.workers.dev/api'
  aiUrl = 'https://ai.prismgcccs.live';


  // Google Cloud Console
  rtUrl = 'https://api.prismgcccs.live/rt';
  apiUrl = 'https://api.prismgcccs.live/instructor';

  // VPS Server
  // rtUrl = 'https://vps.prismgcccs.live/rt';
  // apiUrl = 'https://vps.prismgcccs.live/instructor';




  constructor(private http: HttpClient) { }
  // FINAL AI GENERATION
  finalGenerateAssessment(data: any) {
    return this.http.post(`${this.aiFinal}/assessment/generate`, data);
  }

  bulkfinalGenerateAssessment(data: any) {
    return this.http.post(`${this.aiFinal}/assessment/bulk-generate`, data);
  }



  verifyQuestions(questions: any) {
    return this.http.post(`${this.aiUrl}/verify`, questions);
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
  analyzeResult(data: any) {
    return this.http.post(`${this.aiUrl}/analytics`, data);
  }

  //Analze Result Student Call

  analyzeStudent(data: any) {
    return this.http.post(`${this.aiUrl}/insights`, data);
  }

  recommendedMaterials(data: any) {
    return this.http.post(`${this.aiUrl}/search`, data);
  }

  recommendedMaterialsPlus(data: any) {
    return this.http.post(`${this.aiUrl}/search/multiple`, data)
  }

  materialsValidator(data: any) {
    return this.http.post(`${this.aiUrl}/materials-validator`, data)
  }

  nonObjectChecking(data: any) {
    return this.http.post(`${this.aiUrl}/finalize`, { data });
  }

  //normal api calls here, starts with dashboard

  getStudentPerformance(id: string) {
    return this.http.get(`${this.apiUrl}/students/performance/${id}/getData`);
  }

  getClassesCharts(id: string) {
    return this.http.get(`${this.apiUrl}/classes/performance/${id}/charts`);
  }

  ///

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

  instructorData(data: any) {
    return this.http.post(`${this.apiUrl}/data`, data)
  }

  ///

  instructorDashboardUpdates(instructorId: string): EventSource {
    return new EventSource(`${this.rtUrl}/instructor/stream/${instructorId}/updates`);
  }

  getOngoingAssessments(id: string, limit?: number) {
    const url = limit ? `${this.apiUrl}/getOnGoingAssessments/${id}?limit=${limit}` : `${this.apiUrl}/getOnGoingAssessments/${id}`;
    return this.http.get(url);
  }

  getScheduledAssessments(id: string, limit?: number) {
    const url = limit ? `${this.apiUrl}/getScheduledAssessments/${id}?limit=${limit}` : `${this.apiUrl}/getScheduledAssessments/${id}`;
    return this.http.get(url);
  }

  getOngoingDisputes(id: string) {
    return this.http.get(`${this.apiUrl}/disputes/${id}`);
  }

  //  starts with generateAssessmentPage

  createAssessment(data: any) {
    return this.http.post(`${this.apiUrl}/createAssessment`, data);
  }

  //students page

  approve(data: any) {
    return this.http.post(`${this.apiUrl}/approve`, data);
  }

  removeStudent(data: any) {
    return this.http.post(`${this.apiUrl}/class/removeStudent`, data);
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


  getOwnAssessment(id: string) {
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

  archiveClass(classCode: string, data: any) {
    return this.http.put(`${this.apiUrl}/class/archive/${classCode}`, data);
  }

  exportToJs(data: any) {
    return this.http.post(`${this.apiUrl}/assessment/export`, data, {
      responseType: 'blob',
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  //archive page

  unarchiveClass(classCode: string, data: any) {
    return this.http.put(`${this.apiUrl}/class/unarchive/${classCode}`, data);
  }

  getArchiveClasses(instructorId: string, params: PaginationParams = {}) {
    const defaultParams: PaginationParams = {
      page: 1,
      limit: 10
    };
    const queryParams = { ...defaultParams, ...params };

    let httpParams = new HttpParams();
    if (queryParams.page) httpParams = httpParams.set('page', queryParams.page.toString());
    if (queryParams.limit) httpParams = httpParams.set('limit', queryParams.limit.toString());

    return this.http.post(`${this.apiUrl}/class/archiveClasses`, { instructorId }, { params: httpParams });
  }

  archivesData(data: any) {
    return this.http.post(`${this.apiUrl}/class/archiveData`, data);
  }

  //coordinator page

  studentData(instructorId: string, coordinatedProgram: string, yearLevel?: any, params: PaginationParams = {}) {
    const defaultParams: PaginationParams = {
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc'
    };
    const queryParams = { ...defaultParams, ...params };
    const yearLevelPath = yearLevel !== undefined ? `/${yearLevel}` : '';

    return this.http.get(`${this.apiUrl}/students/coordinator/all/${instructorId}/${coordinatedProgram}${yearLevelPath}/getData`, {
      params: queryParams as any
    });
  }

  coordinatorStats(instructorId: string, coordinatedProgram: string) {
    return this.http.get(`${this.apiUrl}/students/coordinator/stats/${instructorId}/${coordinatedProgram}/getData`);
  }

  coordinatorSearch(id: string, coordinatedProgram: string, searchQuery: string) {
    return this.http.get(`${this.apiUrl}/students/coordinator/search/${id}/${coordinatedProgram}/searchData?searchQuery=${searchQuery}`);
  }

  //evaluate the student
  evaluateAssessmentHistory(studentId: string) {
    return this.http.get(`${this.apiUrl}/students/pastAssessments/${studentId}/getData`);
  }

  evaluateStudentData(id: string) {
    return this.http.get(`${this.apiUrl}/students/evaluate/profile/${id}/studentData`);
  }

  studentSkillSet(id: string) {
    return this.http.get(`${this.apiUrl}/students/skills/${id}/getData`);
  }

  assignSpecific(data: any) {
    return this.http.post(`${this.apiUrl}/assign/specifics`, data);
  }

  skillScraper(id: string) {
    return this.http.get(`${this.apiUrl}/students/evaluate/${id}/getData`);
  }

  skillSearchScrapper(assessmentsWithWrongQuestions: any) {
    return this.http.post(`${this.aiUrl}/skill-evaluator`, { assessmentsWithWrongQuestions });
  }

  skillAIsearch(search_queries: any) {
    return this.http.post(`${this.aiUrl}/search/multiple`, { search_queries });
  }


  // Student assessment page

  retrieveStudents(instructorId: string, params: PaginationParams = {}) {
    const defaultParams: PaginationParams = {
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc'
    };
    const queryParams = { ...defaultParams, ...params };

    return this.http.get(`${this.apiUrl}/students/all/${instructorId}/getData`, {
      params: queryParams as any
    });
  }

  searchStudentUniversal(id: string, query: string) {
    return this.http.get(`${this.apiUrl}/search/student/universal/?query=${query}`);
  }

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

  getScoreStream(id: string): EventSource {
    return new EventSource(`${this.rtUrl}/assessment/result/score/stream/${id}/rt`);
  }

  startNow(data: any) {
    return this.http.post(`${this.apiUrl}/assessment/start`, data);
  }
  endNow(data: any) {
    return this.http.post(`${this.apiUrl}/assessment/end`, data);
  }

  extendNow(data: any) {
    return this.http.post(`${this.apiUrl}/assessment/extend`, data);
  }

  saveInsights(data: any) {
    return this.http.post(`${this.apiUrl}/assessment/insights`, data);
  }

  //result Mastery
  masteryResultData(id: string) {
    return this.http.get(`${this.apiUrl}/assessment/result/${id}`)
  }

  //profile page instructor
  getTeachingSummary(id: string) {
    return this.http.get(`${this.apiUrl}/instructorstats/${id}`);
  }

  //student assessment history page
  studentStatsData(id: string, classCode: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/student/assessment/history/${id}/${classCode}/${studentId}`);
  }
  studentCompletedlist(id: string, classCode: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/student/assessment/history/completed/${id}/${classCode}/${studentId}`);
  }
  studentUpcomingList(id: string, classCode: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/student/assessment/history/upcoming/${id}/${classCode}/${studentId}`);
  }

  //student response page
  getAssessmentDataP(assignedAssessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/response/${assignedAssessmentId}/${studentId}`);
  }
  getDetailedAnswers(assignedAssessmentId: string, studentId: string) {
    return this.http.get(`${this.apiUrl}/assessment/response/answers/${assignedAssessmentId}/${studentId}`);
  }
  rectifyResult(assignedAssessmentId: string, studentId: string, data: {
    instructorId: string;
    adjustments: {
      questionsId: string;
      isCorrect: boolean;
      pointsEarned: number;
    }[]
  }) {
    return this.http.put(
      `${this.apiUrl}/assessment/rectify/${assignedAssessmentId}/${studentId}`,
      data
    );
  }

  getAttemptHistory(data: any) {
    return this.http.post(`${this.apiUrl}/attemptHistory/specific`, data);
  }


  // Assessment Management Routes
  getAllAssessments(instructorId: string, params: PaginationParams = {}) {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get(`${this.apiUrl}/assessments/all/${instructorId}`, { params: httpParams });
  }

  searchAssessments(instructorId: string, query: string, params: PaginationParams = {}) {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    httpParams = httpParams.set('q', query);

    return this.http.get(`${this.apiUrl}/assessments/search/${instructorId}`, { params: httpParams });
  }

  getOngoingAssessmentsWithPagination(instructorId: string, params: PaginationParams = {}) {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get(`${this.apiUrl}/assessments/ongoing/${instructorId}`, { params: httpParams });
  }

  getScheduledAssessmentsWithPagination(instructorId: string, params: PaginationParams = {}) {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get(`${this.apiUrl}/assessments/scheduled/${instructorId}`, { params: httpParams });
  }

  getCompletedAssessments(instructorId: string, params: PaginationParams = {}) {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get(`${this.apiUrl}/assessments/completed/${instructorId}`, { params: httpParams });
  }

  // Get assessment counts
  getAssessmentCounts(instructorId: string) {
    return this.http.get(`${this.apiUrl}/assessments/counts/${instructorId}`);
  }

  //edit/update assessment page

  retrieveAssessmentData(data: any) {
    return this.http.post(`${this.apiUrl}/assessment/review`, data);
  }

  updateAssessmentData(data: any) {
    return this.http.post(`${this.apiUrl}/assessment/update`, data);
  }

  //assignedAssessment settings page

  getAssessmentDetails(id: string) {
    return this.http.get(`${this.apiUrl}/assessment/configuration/${id}`)
  }

  updateAssessmentDetails(data: any) {
    return this.http.put(`${this.apiUrl}/assessment/update/config`, data)
  }



}
