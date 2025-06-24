import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, filter, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private router = inject(Router);
  private currentTitleSubject = new BehaviorSubject<string>('Dashboard');
  
  public currentTitle$ = this.currentTitleSubject.asObservable();

  private routeTitleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/assets': 'Assets',
    '/asset-models': 'Asset Models',
    '/asset-pos': 'Asset POs',
    '/vendors': 'Vendors',
    '/os-versions': 'OS & Versions',
    '/users': 'Users'
  };

  constructor() {
    this.setupRouteTracking();
  }

  private setupRouteTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => event as NavigationEnd)
      )
      .subscribe(event => {
        this.updateTitle(event.url);
      });
    
    // Set initial title
    this.updateTitle(this.router.url);
  }

  private updateTitle(url: string): void {
    // Remove query parameters and fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    const title = this.routeTitleMap[cleanUrl] || 'Celcom Solutions';
    this.currentTitleSubject.next(title);
  }

  public setTitle(title: string): void {
    this.currentTitleSubject.next(title);
  }

  public getCurrentTitle(): string {
    return this.currentTitleSubject.value;
  }
} 