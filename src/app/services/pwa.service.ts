import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private installPromptEvent: any = null;
  private isInstallableSubject = new BehaviorSubject<boolean>(false);
  private isInstalledSubject = new BehaviorSubject<boolean>(this.isStandaloneMode());

  constructor() {
    this.initializePwaListeners();
  }

  /**
   * Check if app is running in standalone mode (installed as PWA)
   */
  isStandaloneMode(): boolean {
    return (window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any)?.standalone ||
      document.referrer.includes('android-app://');
  }

  /**
   * Check if app is installable
   */
  get isInstallable(): Observable<boolean> {
    return this.isInstallableSubject.asObservable();
  }

  /**
   * Check if app is installed
   */
  get isInstalled(): Observable<boolean> {
    return this.isInstalledSubject.asObservable();
  }

  /**
   * Check if service worker is supported
   */
  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Check if service worker is active
   */
  async isServiceWorkerActive(): Promise<boolean> {
    if (!this.isServiceWorkerSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return registration.active !== null;
    } catch (error) {
      console.error('Error checking service worker status:', error);
      return false;
    }
  }

  /**
   * Get service worker status for debugging
   */
  async getServiceWorkerStatus(): Promise<any> {
    if (!this.isServiceWorkerSupported()) {
      return { supported: false, active: false, controller: null };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return {
        supported: true,
        active: registration.active !== null,
        controller: navigator.serviceWorker.controller !== null,
        state: registration.active?.state,
        scope: registration.scope,
        updateViaCache: registration.updateViaCache
      };
    } catch (error) {
      return {
        supported: true,
        active: false,
        controller: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPromptEvent) {
      return false;
    }

    try {
      this.installPromptEvent.prompt();
      const choiceResult = await this.installPromptEvent.userChoice;

      if (choiceResult.outcome === 'accepted') {
        this.installPromptEvent = null;
        this.isInstallableSubject.next(false);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error prompting PWA install:', error);
      return false;
    }
  }

  /**
   * Get display mode
   */
  getDisplayMode(): 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    return 'browser';
  }

  /**
   * Initialize PWA event listeners
   */
  private initializePwaListeners(): void {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPromptEvent = event;
      this.isInstallableSubject.next(true);
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.installPromptEvent = null;
      this.isInstallableSubject.next(false);
      this.isInstalledSubject.next(true);
      console.log('PWA was installed successfully');
    });

    // Listen for display mode changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (event) => {
      this.isInstalledSubject.next(event.matches);
    });
  }
} 