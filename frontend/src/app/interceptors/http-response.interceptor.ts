import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class HttpResponseInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map(event => {
        // Handle 204 No Content responses
        if (event instanceof HttpResponse && event.status === 204) {
          // For DELETE operations, return a successful empty response
          if (req.method === 'DELETE') {
            return event.clone({
              body: null,
              status: 200 // Convert to 200 for easier handling
            });
          }
          
          // For PUT operations that return 204, also handle gracefully
          if (req.method === 'PUT') {
            return event.clone({
              body: null,
              status: 200
            });
          }
        }
        
        return event;
      })
    );
  }
} 