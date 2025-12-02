import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // sklip nebius ai
        if (req.url.includes('api.studio.nebius.com') || req.url.includes('prism-ai-worker.asherjamesmayson.workers.dev') || req.url.includes('http://127.0.0.1:8787/api')) {
            return next.handle(req);
        }

        const token = this.authService.getToken();

        if (token && this.authService.isAuthenticated()) {
            const authReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            return next.handle(authReq);
        }

        return next.handle(req);
    }
}
