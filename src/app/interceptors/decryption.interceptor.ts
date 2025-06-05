import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EncryptionService } from '../services/encryption.service';

@Injectable()
export class DecryptionInterceptor implements HttpInterceptor {
  constructor(private encryptionService: EncryptionService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (req.body && this.encryptionService.shouldEncryptRequest(req.url)) {
      return from(this.encryptRequest(req)).pipe(
        switchMap(encryptedReq => this.handleResponse(next.handle(encryptedReq)))
      );
    }

    // Handle response decryption only
    return this.handleResponse(next.handle(req));
  }

  //used this method to encrypt the request with itz yah boi's name 
  private async encryptRequest(req: HttpRequest<any>): Promise<HttpRequest<any>> {
    try {
      const r3d = await this.encryptionService.encrypt(req.body);
        const encryptedReq = req.clone({
        body: {r3d },
        setHeaders: {
          'Content-Type': 'application/json',
          'X-Encrypted': 'true' 
        }
      });
      
      return encryptedReq;
    } catch (error) {
      console.error('Request encryption error:', error);
      return req;
    }
  }

  private handleResponse(response$: Observable<any>): Observable<any> {
    return response$.pipe(
      switchMap(event => {
        if (event instanceof HttpResponse && event.body) {
          return from(this.processResponse(event.body)).pipe(
            switchMap(processedBody => {
              return [event.clone({ body: processedBody })];
            })
          );
        }
        return [event];
      })
    );
  }

  private async processResponse(responseBody: any): Promise<any> {
    try {
      if (responseBody && 
          responseBody.remarks === 'Success' && 
          responseBody.data && 
          this.encryptionService.isEncrypted(responseBody.data)) {
        
        // Decrypt the data field
        const decryptedData = await this.encryptionService.decrypt(responseBody.data);
        
        responseBody.data = JSON.parse(decryptedData);
      }
      
      return responseBody;
    } catch (error) {
      console.error('Response decryption error:', error);
      return responseBody;
    }
  }
}
