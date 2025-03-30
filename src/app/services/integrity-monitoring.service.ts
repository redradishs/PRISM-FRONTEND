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
  private readonly BLUR_COOLDOWN = 20000; // 20 seconds

  // Storage monitoring
  private storageCheckInterval: any;

  // Pattern detection
  private rapidActionCount = 0;
  private lastActionTime = 0;
  private readonly RAPID_ACTION_THRESHOLD = 3000; // 3 seconds

  // Public observables
  public cheatingCount$: Observable<number> =
    this._cheatingCount.asObservable();
  public cheatMessage$: Observable<string | null> =
    this._cheatMessage.asObservable();
  public violations$: Observable<Violation[]> = this._violations.asObservable();

  constructor(private ngZone: NgZone) {
    this.loadCheatingCount();
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
    document.addEventListener(
      'mousemove',
      () => (this.lastActivity = Date.now())
    );
    document.addEventListener('keydown', (e) => {
      this.lastActivity = Date.now();
      this.handleKeyDown(e);
    });

    // Tab visibility
    document.addEventListener('visibilitychange', () =>
      this.handleVisibilityChange()
    );

    // Window events
    window.addEventListener('blur', () => this.onWindowBlur());
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('beforeunload', (e) => this.beforeUnloadHandler(e));
    window.addEventListener('storage', (e) => this.handleStorageChange(e));
  }

  // Public methods for external components to use

  // Get current values
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
          `${new Date(v.timestamp).toLocaleTimeString()}: ${v.type} (${
            v.severity
          })`
      )
      .join('\n');
  }

  // Clear warning message
  public clearMessage(): void {
    this._cheatMessage.next(null);
  }

  // Cleanup method to call when component is destroyed
  public cleanup(): void {
    if (this.storageCheckInterval) {
      clearInterval(this.storageCheckInterval);
    }
    if (this.tabSwitchResetTimer) {
      clearTimeout(this.tabSwitchResetTimer);
    }
    if (this.altTabResetTimer) {
      clearTimeout(this.altTabResetTimer);
    }
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
    this.tabSwitchResetTimer = setInterval(() => {
      if (
        this.tabSwitchCount > 0 &&
        this.tabSwitchCount <= this.TAB_SWITCH_ALLOWANCE
      ) {
        this.tabSwitchCount = Math.max(0, this.tabSwitchCount - 1);
      }
    }, 120000);

    this.altTabResetTimer = setInterval(() => {
      if (this.altTabCount > 0 && this.altTabCount <= this.ALT_TAB_ALLOWANCE) {
        this.altTabCount = Math.max(0, this.altTabCount - 1);
      }
    }, 120000);
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

  private handleVisibilityChange() {
    if (document.hidden) {
      this.tabSwitchCount++;

      if (this.tabSwitchCount > this.TAB_SWITCH_ALLOWANCE) {
        // Check if it's a pattern of rapid switching
        const now = Date.now();
        if (now - this.lastActionTime < this.RAPID_ACTION_THRESHOLD) {
          this.rapidActionCount++;
          if (this.rapidActionCount >= 3) {
            this.registerViolation('Rapid tab switching detected', 'high');
          } else {
            this.registerViolation(
              'Excessive tab switching detected',
              'medium'
            );
          }
        } else {
          this.rapidActionCount = 1;
        }
        this.lastActionTime = now;
      } else {
        this.showWarning(
          `Tab switch detected (${this.tabSwitchCount}/${this.TAB_SWITCH_ALLOWANCE} allowed)`
        );
      }
    }
  }

  private onWindowBlur() {
    const now = Date.now();
    if (now - this.lastBlurTime > this.BLUR_COOLDOWN) {
      this.lastBlurTime = now;
      this.showWarning('Window focus lost');
    }
  }

  private onWindowResize() {
    if (window.innerWidth < 500 || window.innerHeight < 300) {
      this.registerViolation('Window significantly resized', 'medium');
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.altKey && event.key === 'Tab') {
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

    if (event.key === 'PrintScreen') {
      this.registerViolation('Screenshot attempt detected', 'high');
    }
  }

  private beforeUnloadHandler(event: BeforeUnloadEvent) {
    event.returnValue =
      'Are you sure you want to leave? Your progress may be lost.';
    return event.returnValue;
  }

  private handleStorageChange(e: StorageEvent) {
    if (e.key && e.key.startsWith('assessment_')) {
      if (!e.newValue) {
        this.checkStorageIntegrity();
      }
    }
  }

  private checkStorageIntegrity() {
    // Compare localStorage and sessionStorage values
    const localData = localStorage.getItem('assessment_integrity_data');
    const sessionData = sessionStorage.getItem('assessment_integrity_data');
    
    if (this._violations.value.length > 0) {
      if (!localData && !sessionData) {
        this.handleStorageDeletion();
        return;
      }
    }
    
    // If both exist but don't match, sync them rather than flagging
    // This handles normal usage where one might update before the other
    if (localData && sessionData && localData !== sessionData) {
      // Check if both are valid JSON before assuming tampering
      try {
        const localViolations = JSON.parse(atob(localData));
        const sessionViolations = JSON.parse(atob(sessionData));
        
        // If both parse successfully, use the one with more violations
        if (Array.isArray(localViolations) && Array.isArray(sessionViolations)) {
          if (localViolations.length >= sessionViolations.length) {
            sessionStorage.setItem('assessment_integrity_data', localData);
          } else {
            localStorage.setItem('assessment_integrity_data', sessionData);
          }
          return;
        }
      } catch (e) {
        // If parsing fails, then it might be tampering
        this.handleStorageTampering();
        return;
      }
    }
    
    // Check timestamps
    const localTime = localStorage.getItem('assessment_init_time');
    const sessionTime = sessionStorage.getItem('assessment_init_time');
    
    if (localTime && sessionTime && localTime !== sessionTime) {
      // Instead of immediately flagging, try to sync them
      const localTimeNum = parseInt(localTime, 10);
      const sessionTimeNum = parseInt(sessionTime, 10);
      
      if (!isNaN(localTimeNum) && !isNaN(sessionTimeNum)) {
        // Use the earlier timestamp (more likely to be original)
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

  // Core functionality

  private showWarning(message: string) {
    this._cheatMessage.next(`Warning: ${message}`);
    console.warn(`Warning: ${message}`);

    setTimeout(() => {
      if (this._cheatMessage.value === `Warning: ${message}`) {
        this._cheatMessage.next(null);
      }
    }, 5000);
  }

  private registerViolation(reason: string, severity: string) {
    const violations = [...this._violations.value];

    violations.push({
      type: reason,
      timestamp: Date.now(),
      severity: severity,
    });

    // Update violations
    this._violations.next(violations);

    // Update count
    this.updateCheatingCount();

    // Show message
    this._cheatMessage.next(
      `Integrity Alert: ${reason}. This activity has been logged.`
    );

    // Store data
    this.secureStoreViolations();

    console.warn(`Integrity Alert: ${reason}`);
  }

  private updateCheatingCount() {
    // Remove expired violations
    const now = Date.now();
    const currentViolations = this._violations.value.filter(
      (v) => now - v.timestamp < this.VIOLATION_EXPIRY
    );

    // Update violations
    this._violations.next(currentViolations);

    // Update count
    this._cheatingCount.next(currentViolations.length);

    // Store count
    this.secureStoreCheatingCount();
  }

  private secureStoreViolations() {
    const encoded = btoa(JSON.stringify(this._violations.value));
    localStorage.setItem('assessment_integrity_data', encoded);
    sessionStorage.setItem('assessment_integrity_data', encoded);

    document.cookie = `assessment_count=${this._cheatingCount.value};path=/;max-age=86400`;
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
      
      if (!encoded) {
        const cookieMatch = document.cookie.match(/assessment_count=(\d+)/);
        if (cookieMatch && cookieMatch[1]) {
          const count = parseInt(cookieMatch[1], 10);
          this._cheatingCount.next(count);
          
          if (count > 0) {
            this.registerViolation('Storage data deletion detected', 'high');
            return;
          }
        }
      }
      
      if (encoded) {
        try {
          const violations = JSON.parse(atob(encoded)) as Violation[];
          
          const now = Date.now();
          const currentViolations = violations.filter(
            (v) => now - v.timestamp < this.VIOLATION_EXPIRY
          );
          
          this._violations.next(currentViolations);
          this._cheatingCount.next(currentViolations.length);
          
          this.secureStoreViolations();
        } catch (e) {
          console.warn('Error parsing integrity data');
        }
      }
    } catch (e) {
      console.error('Error loading integrity data', e);
    }
  }

  getViolations() {
    return this._violations.value.map(violation => {
      // Format timestamp to readable time (e.g., "3:15 PM")
      const date = new Date(violation.timestamp);
      const formattedTime = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      
      return {
        type: violation.type,
        time: formattedTime
      };
    });
  }

  resetViolations() {
    this._violations.next([]);
    this._cheatingCount.next(0);
    this._cheatMessage.next(null);
    
    localStorage.removeItem('violations');
    sessionStorage.removeItem('violations');
  }
}
