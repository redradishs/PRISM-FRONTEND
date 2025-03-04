import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { isLocalStorageAvailable } from '../shared/environment.utils';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private baseUrl = 'http://localhost:8000/user';
  private baseUrl = 'https://prismcdn.onrender.com/user';
  private tokenKey = 'jwt';
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object, private router: Router) {
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      if (token) {
        const decoded = this.decodeToken(token);
        this.currentUserSubject.next(decoded?.data || null);
      }
    }
  }

  userLogin(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, data).pipe(
      catchError(this.handleError)
    );
  }

  userSignUp(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/signup`, data).pipe(
      catchError(this.handleError)
    );
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
      this.currentUserSubject.next(decoded?.data || null);
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

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId) && isLocalStorageAvailable()) {
      localStorage.removeItem(this.tokenKey);
      this.currentUserSubject.next(null);
      this.router.navigate(['/login']);
    }
  }

  private decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
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
    return currentUser ? currentUser.role : null;
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
}
