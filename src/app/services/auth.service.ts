import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { isLocalStorageAvailable } from '../shared/environment.utils';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

interface ProfileChanges {
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  phone?: string;
  alternateEmail?: string;
  bio?: string;
  program?: string;
  yearLevel?: string;
  block?: string;
  isCoordinator?: 'yes' | 'no';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // private baseUrl = 'http://localhost:8000/user';
  // private prism_set = 'http://localhost:8000/settings';
  // private prism_public = 'http://localhost:8000/public';
  // private baseUrl = 'https://prismcdn.onrender.com/user';
  // private baseUrl = 'https://prismapi2.onrender.com/user';
  // private prism_set = 'https://prismapi2.onrender.com/settings';
  // private prism_public = 'https://prismapi2.onrender.com/public';

  // Google Cloud Console 
  private baseUrl = 'https://api.prismgcccs.live/user';
  private prism_set = 'https://api.prismgcccs.live/settings';
  private prism_public = 'https://api.prismgcccs.live/public';

  private tokenKey = 'jwt';
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      if (token) {
        const decoded = this.decodeToken(token);
        this.currentUserSubject.next(decoded?.data || null);
      }
    }
  }

  platformWideSettings() {
    return this.http.get(`${this.prism_set}/prism_sws`);
  }

  userLogin(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/login`, data)
  }

  userSignUp(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/signup`, data)
  }

  completeProfile(data: any) {
    return this.http.post(`${this.baseUrl}/complete-profile`, data)
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'Invalid username or password.';
          break;
        case 404:
          errorMessage = 'No user matched.';
          break;
        default:
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId) && isLocalStorageAvailable()) {
      localStorage.setItem(this.tokenKey, token);
      const decoded = this.decodeToken(token);
      this.currentUserSubject.next(decoded.data);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId) && isLocalStorageAvailable()) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? !this.isTokenExpired(token) : false;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId) && isLocalStorageAvailable()) {
      localStorage.clear();
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Invalid token format:', e);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const decodedToken = this.decodeToken(token);
    if (decodedToken && decodedToken.exp) {
      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decodedToken.exp);
      return expirationDate < new Date();
    }
    return true;
  }

  getCurrentUser(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  getUserRole(): string | null {
    const currentUser = this.currentUserSubject.value;
    const role = currentUser?.role;
    return role || null;
  }

  isStudent(): boolean {
    return this.getUserRole() === 'student';
  }

  isInstructor(): boolean {
    return this.getUserRole() === 'instructor';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isUserSignedIn(): boolean {
    return this.isAuthenticated();
  }

  verifyEmail(userId: string, code: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/verify-email`, { userId, code })
  }

  resendVerificationCode(userId: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/resend-verification`, { userId })
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/forgot-password`, { email })
  }

  verifyResetCode(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/verify-reset-code`, data)
  }

  resetPassword(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/reset-password`, data)
  }

  //profile page instructor
  getCurrentProfile(id: string) {
    return this.http.get(`${this.baseUrl}/profile/${id}`)
  }

  changePassword(id: string, data: any) {
    return this.http.put(`${this.baseUrl}/profile/change-password/${id}`, data)
  }

  updateProfile(userId: string, changes: ProfileChanges) {
    return this.http.put(`${this.baseUrl}/profile/update/${userId}`, changes);
  }

  googleSignIn(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/oauth/google`, data);
  }

  loginHistory(userId: string) {
    return this.http.get(`${this.baseUrl}/loginHistory/${userId}`);
  }

  //PUBLIC JOIN ENDPOINTS

  getPublicAssessmentData(data: any) {
    return this.http.post(`${this.prism_public}/assessment`, data);
  }

  getPublicClassData(data: any) {
    return this.http.post(`${this.prism_public}/class`, data);
  }


}
