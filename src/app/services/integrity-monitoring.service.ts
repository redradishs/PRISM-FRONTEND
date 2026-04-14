import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Violation {
  type: string;
  timestamp: number;
  severity: string;
}

@Injectable({
  providedIn: 'root',
})
export class IntegrityMonitoringService {
  private _cheatingCount = new BehaviorSubject<number>(0);
  private _cheatMessage = new BehaviorSubject<string | null>(null);
  private _violations = new BehaviorSubject<Violation[]>([]);

  private lastActivity = Date.now();
  private inactivityThreshold = 180000; // 3 minutes
  private readonly VIOLATION_EXPIRY = 300000; // 5 minutes

  // Tab switch tracking
  private tabSwitchCount = 0;
  private readonly TAB_SWITCH_ALLOWANCE = 3;
  private tabSwitchResetTimer: any;

  // Alt+Tab tracking
  private altTabCount = 0;
  private readonly ALT_TAB_ALLOWANCE = 3;
  private altTabResetTimer: any;

  // Window blur tracking
  private lastBlurTime = 0;
  private readonly BLUR_COOLDOWN = 3000;
  private isUserActive = true;
  private blurCount = 0;
  private readonly MAX_BLUR_COUNT = 3;

  // Storage monitoring
  private storageCheckInterval: any;

  // Pattern detection
  private rapidActionCount = 0;
  private lastActionTime = 0;
  private readonly RAPID_ACTION_THRESHOLD = 3000;

  // ✅ Deduplication tracking
  private lastViolation: { type: string; timestamp: number } | null = null;
  private readonly DEBOUNCE_TIME = 500;

  // DevTools persistent detection tracking
  private devToolsDetected = false;
  private devToolsCheckInterval: any;

  // Window resize tracking
  private initialWidth = window.innerWidth;
  private initialHeight = window.innerHeight;
  private resizeTimer: any;
  private readonly RESIZE_SHRINK_THRESHOLD = 0.6;

  // Public observables
  public cheatingCount$: Observable<number> =
    this._cheatingCount.asObservable();
  public cheatMessage$: Observable<string | null> =
    this._cheatMessage.asObservable();
  public violations$: Observable<Violation[]> = this._violations.asObservable();

  constructor(private ngZone: NgZone) {
    // load violations from storage but don't start monitoring automatically
    this.loadCheatingCount();
  }

  // Public method to start monitoring - call this only on assessment pages
  public startMonitoring(): void {
    this.setupMonitoring();
  }

  // Initialize all monitoring
  private setupMonitoring() {
    this.monitorStorageDeletion();
    this.startInactivityMonitor();
    this.setupAccidentalActionResets();
    this.setupEventListeners();
  }

  // Set up all event listeners
  private setupEventListeners() {
    // Activity tracking
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('keydown', this.handleKeyDown);

    // Tab visibility - core functionality for detecting tab switching
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Window focus handling with improved accuracy
    window.addEventListener('blur', this.handleWindowBlur);

    // Window resize monitoring
    window.addEventListener('resize', this.handleWindowResize);

    // Copy/Paste Prevention
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);

    // Storage events
    window.addEventListener('storage', this.handleStorageChange);

    // Add DevTools detection
    this.detectDevTools();
  }



  public getCheatingCount(): number {
    return this._cheatingCount.value;
  }

  public getCurrentMessage(): string | null {
    return this._cheatMessage.value;
  }

  // Get violation history as formatted string
  public getViolationHistory(): string {
    return this._violations.value
      .map(
        (v) =>
          `${new Date(v.timestamp).toLocaleTimeString()}: ${v.type} (${v.severity
          })`
      )
      .join('\n');
  }

  // Public method to register violations from components
  public registerViolation(reason: string, severity: string): void {
    const now = Date.now();

    if (this.lastViolation) {
      const timeDiff = now - this.lastViolation.timestamp;
      const isSameType = this.lastViolation.type === reason;

      if (isSameType && timeDiff < this.DEBOUNCE_TIME) {
        console.log(`Ignoring the duplicate ${reason})`);
        return;
      }
    }

    // Record the violation
    const violations = [...this._violations.value];

    violations.push({
      type: reason,
      timestamp: now,
      severity: severity,
    });

    this._violations.next(violations);
    this.lastViolation = { type: reason, timestamp: now };

    this.updateCheatingCount();

    this._cheatMessage.next(
      `Integrity Alert: ${reason}. This activity has been logged.`
    );

    this.secureStoreViolations();

    console.warn(`Integrity Alert: ${reason}`);
  }

  // Public method to clear just the alert message
  public clearAlerts(): void {
    this._cheatMessage.next(null);
  }

  // Cleanup method to call when component is destroyed
  public cleanup(): void {
    if (this.storageCheckInterval) {
      clearInterval(this.storageCheckInterval);
      this.storageCheckInterval = null;
    }
    if (this.tabSwitchResetTimer) {
      clearTimeout(this.tabSwitchResetTimer);
      this.tabSwitchResetTimer = null;
    }
    if (this.altTabResetTimer) {
      clearTimeout(this.altTabResetTimer);
      this.altTabResetTimer = null;
    }
    if (this.devToolsCheckInterval) {
      clearInterval(this.devToolsCheckInterval);
      this.devToolsCheckInterval = null;
    }
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }

    // Remove all event listeners that were added
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('storage', this.handleStorageChange);
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);

    console.log('Integrity monitoring cleanup completed');
  }

  // Private implementation methods

  private startInactivityMonitor() {
    setInterval(() => {
      this.ngZone.run(() => {
        const now = Date.now();
        if (now - this.lastActivity > this.inactivityThreshold) {
          if (now - this.lastActivity > this.inactivityThreshold * 2) {
            this.registerViolation('Extended inactivity detected', 'medium');
          } else {
            this.showWarning(
              'Inactivity detected - please continue your assessment'
            );
          }
          this.lastActivity = now;
        }
      });
    }, 60000);
  }

  private setupAccidentalActionResets() {
    //for data integrity, saves the violation every 30 seconds
    setInterval(() => {
      this.secureStoreViolations();
    }, 30000);
  }

  private monitorStorageDeletion() {
    this.storeTimestamps();

    this.storageCheckInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.checkStorageIntegrity();
      });
    }, 10000);
  }

  private storeTimestamps() {
    const now = Date.now();
    localStorage.setItem('assessment_init_time', now.toString());
    sessionStorage.setItem('assessment_init_time', now.toString());
  }

  // Event handlers

  private onWindowBlur() {
    const now = Date.now();
    if (now - this.lastBlurTime > this.BLUR_COOLDOWN) {
      this.lastBlurTime = now;
      this.showWarning('Window focus lost');
    }
  }


  private beforeUnloadHandler(event: BeforeUnloadEvent) {
    event.returnValue =
      'Are you sure you want to leave? Your progress may be lost.';
    return event.returnValue;
  }

  private checkStorageIntegrity() {
    const localData = localStorage.getItem('assessment_integrity_data');
    const sessionData = sessionStorage.getItem('assessment_integrity_data');

    if (this._violations.value.length > 0) {
      if (!localData && !sessionData) {
        this.handleStorageDeletion();
        return;
      }
    }
    //check if tampering occurred
    if (localData && sessionData && localData !== sessionData) {
      try {
        const localViolations = JSON.parse(atob(localData));
        const sessionViolations = JSON.parse(atob(sessionData));
        if (Array.isArray(localViolations) && Array.isArray(sessionViolations)) {
          if (localViolations.length >= sessionViolations.length) {
            sessionStorage.setItem('assessment_integrity_data', localData);
          } else {
            localStorage.setItem('assessment_integrity_data', sessionData);
          }
          return;
        }
      } catch (e) {
        // it not the same, log as tampering
        this.handleStorageTampering();
        return;
      }
    }

    // Check timestamps
    const localTime = localStorage.getItem('assessment_init_time');
    const sessionTime = sessionStorage.getItem('assessment_init_time');

    if (localTime && sessionTime && localTime !== sessionTime) {
      const localTimeNum = parseInt(localTime, 10);
      const sessionTimeNum = parseInt(sessionTime, 10);

      if (!isNaN(localTimeNum) && !isNaN(sessionTimeNum)) {
        const earlierTime = Math.min(localTimeNum, sessionTimeNum).toString();
        localStorage.setItem('assessment_init_time', earlierTime);
        sessionStorage.setItem('assessment_init_time', earlierTime);
      } else {
        this.handleStorageTampering();
      }
    }
  }

  private handleStorageDeletion() {
    this.registerViolation('Storage data deletion detected', 'high');
    this.secureStoreViolations();
  }

  private handleStorageTampering() {
    this.registerViolation('Storage data tampering detected', 'high');
    this.secureStoreViolations();
  }


  private showWarning(message: string) {
    this._cheatMessage.next(`Warning: ${message}`);
    console.warn(`Warning: ${message}`);

    setTimeout(() => {
      if (this._cheatMessage.value === `Warning: ${message}`) {
        this._cheatMessage.next(null);
      }
    }, 5000);
  }

  private updateCheatingCount() {
    const currentViolations = this._violations.value;

    this._cheatingCount.next(currentViolations.length);
    this.secureStoreCheatingCount();
  }

  private secureStoreViolations() {
    const dataToStore = JSON.stringify(this._violations.value);

    const encoded = this.encryptData(dataToStore);
    localStorage.setItem('assessment_integrity_data', encoded);
    sessionStorage.setItem('assessment_integrity_data', encoded);

    const timestamp = Date.now().toString();
    const hashedTimestamp = this.hashString(timestamp);

    localStorage.setItem('assessment_integrity_time', hashedTimestamp);
    sessionStorage.setItem('assessment_integrity_time', hashedTimestamp);

    document.cookie = `assessment_count=${this._cheatingCount.value};path=/;max-age=86400;secure`;
  }

  private secureStoreCheatingCount() {
    localStorage.setItem(
      'assessment_integrity_count',
      this._cheatingCount.value.toString()
    );
    sessionStorage.setItem(
      'assessment_integrity_count',
      this._cheatingCount.value.toString()
    );
  }

  private loadCheatingCount() {
    try {
      let encoded = sessionStorage.getItem('assessment_integrity_data');

      if (!encoded) {
        encoded = localStorage.getItem('assessment_integrity_data');
      }

      if (encoded) {
        try {

          let dataToDecrypt = encoded;
          if (encoded.includes('_')) {
            const parts = encoded.split('_');
            if (parts.length === 2) {
              const checksum = parts[0];
              dataToDecrypt = parts[1];
            }
          }

          const violations = JSON.parse(atob(dataToDecrypt)) as Violation[];

          this._violations.next(violations);
          this._cheatingCount.next(violations.length);

          this.secureStoreViolations();
        } catch (e) {
          console.warn('❌ Error parsing integrity data:', e);
        }
      } else {
        this._violations.next([]);
        this._cheatingCount.next(0);
      }
    } catch (e) {
      console.error('💥 Error loading integrity data:', e);
    }
  }

  getViolations() {

    return this._violations.value.map(violation => ({
      type: violation.type,
      severity: violation.severity,
      timestamp: violation.timestamp
    }));
  }

  resetAllViolations() {

    this._violations.next([]);
    this._cheatingCount.next(0);
    this._cheatMessage.next(null);
    this.lastViolation = null;
    this.devToolsDetected = false; // Reset DevTools detection flag

    localStorage.removeItem('assessment_integrity_data');
    sessionStorage.removeItem('assessment_integrity_data');
    localStorage.removeItem('assessment_integrity_count');
    sessionStorage.removeItem('assessment_integrity_count');
    localStorage.removeItem('assessment_init_time');
    sessionStorage.removeItem('assessment_init_time');

    document.cookie = 'assessment_count=0; path=/; max-age=0';
    this.storeTimestamps();

    console.log('Monitoring reset at', new Date().toISOString());
  }

  // Add encryption helper methods
  private encryptData(data: string): string {
    const key = "PRISM_ASSESSMENT_SYSTEM";
    let result = btoa(data);
    const checksum = this.hashString(data).substring(0, 8);
    result = checksum + '_' + result;

    return result;
  }

  private hashString(str: string): string {
    // Simple hash function for enc
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Detect if DevTools is open
  private detectDevTools() {
    const startTime = new Date().getTime();
    debugger;
    const endTime = new Date().getTime();

    if (endTime - startTime > 100 && !this.devToolsDetected) {
      this.devToolsDetected = true;
      this.registerViolation('Developer tools detected', 'high');
    }

    // Console override detection (one-time setup)
    const consoleCheck = () => {
      const original = window.console.log;
      window.console.log = (...args) => {
        const stack = new Error().stack || '';
        if (stack.includes('console-api') || stack.includes('debugger')) {
          if (!this.devToolsDetected) {
            this.devToolsDetected = true;
            this.registerViolation('Console API usage detected', 'medium');
          }
        }
        original(...args);
      };
    };

    consoleCheck();
  }

  private handleMouseMove = () => {
    this.lastActivity = Date.now();
    this.isUserActive = true;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.lastActivity = Date.now();
    this.isUserActive = true;

    // Screenshot detection
    if (e.key === 'PrintScreen' || (e.key === 'S' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
      this.registerViolation('Screenshot attempt detected', 'high');
    }

    // Alt+Tab detection
    if (e.altKey && e.key === 'Tab') {
      this.altTabCount++;

      if (this.altTabCount > this.ALT_TAB_ALLOWANCE) {
        const now = Date.now();
        if (now - this.lastActionTime < this.RAPID_ACTION_THRESHOLD) {
          this.rapidActionCount++;
          if (this.rapidActionCount >= 3) {
            this.registerViolation('Rapid Alt+Tab switching detected', 'high');
          } else {
            this.registerViolation('Excessive Alt+Tab detected', 'medium');
          }
        } else {
          this.rapidActionCount = 1;
        }
        this.lastActionTime = now;
      } else {
        this.showWarning(
          `Alt+Tab detected (${this.altTabCount}/${this.ALT_TAB_ALLOWANCE} allowed)`
        );
      }
    }

    // mapping of shortcuts
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();

      const shortcutMap: { [key: string]: string } = {
        'c': 'Copy attempt detected',
        'v': 'Paste attempt detected',
        'x': 'Cut attempt detected',
        'a': 'Select all attempt detected',
        's': 'Save attempt detected',
        'p': 'Print attempt detected',
        'f': 'Find attempt detected',
        'h': 'Replace attempt detected',
        'u': 'View source attempt detected',
        'r': 'Refresh attempt detected',
        'w': 'Close tab attempt detected',
        't': 'New tab attempt detected',
        'n': 'New window attempt detected'
      };

      if (shortcutMap[key]) {
        this.registerViolation(shortcutMap[key], 'medium');
      }

      if (key === 'i' || key === 'j') {
        e.preventDefault();
        this.registerViolation('DevTools attempt detected', 'high');
      }
    }

    if (e.key === 'F12') {
      e.preventDefault();
      this.registerViolation('DevTools attempt detected', 'high');
    }
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      const now = Date.now();

      if (now - this.lastActionTime < this.RAPID_ACTION_THRESHOLD) {
        this.rapidActionCount++;
        if (this.rapidActionCount >= 3) {
          this.registerViolation('Rapid tab switching detected', 'high');
        }
      } else {
        this.rapidActionCount = 1;
        this.registerViolation('Tab switch detected', 'medium');
      }

      this.lastActionTime = now;
    }
  };

  private handleWindowBlur = () => {
    const now = Date.now();

    if (this.isUserActive && (now - this.lastBlurTime > this.BLUR_COOLDOWN)) {
      this.blurCount++;

      if (this.blurCount === 1) {
        this.showWarning('Please stay focused on the exam');
      }

      if (this.blurCount >= this.MAX_BLUR_COUNT) {
        this.registerViolation('Multiple window focus losses detected', 'medium');
        this.blurCount = 0;
      }

      this.lastBlurTime = now;
    }
  };

  private handleWindowResize = () => {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      // DevTools gap detection (desktop only)
      if (!isMobile) {
        const widthGap = window.outerWidth - currentWidth > 160;
        const heightGap = window.outerHeight - currentHeight > 160;

        if (widthGap || heightGap) {
          this.registerViolation('Developer tools detected via resize', 'medium');
        }
      }

      // Sudden shrink detection — e.g. window snapped to half-screen
      const widthRatio = currentWidth / this.initialWidth;
      const heightRatio = currentHeight / this.initialHeight;

      if (widthRatio < this.RESIZE_SHRINK_THRESHOLD || heightRatio < this.RESIZE_SHRINK_THRESHOLD) {
        this.registerViolation('Suspicious window resizing detected', 'medium');
      }
    }, 300);
  };

  private handleCopy = (e: Event) => {
    e.preventDefault();
    this.registerViolation('Copy attempt detected', 'medium');
  };

  private handlePaste = (e: Event) => {
    e.preventDefault();
    this.registerViolation('Paste attempt detected', 'medium');
  };

  private handleStorageChange = (e: StorageEvent) => {
    if (e.key && e.key.startsWith('assessment_')) {
      if (!e.newValue) {
        this.checkStorageIntegrity();
      }
    }
  };
}
