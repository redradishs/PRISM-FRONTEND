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
  private readonly BLUR_COOLDOWN = 3000; // 3 seconds cooldown
  private isUserActive = true;
  private blurCount = 0;
  private readonly MAX_BLUR_COUNT = 3; // Max number of quick blurs before violation

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
    document.addEventListener('mousemove', () => {
      this.lastActivity = Date.now();
      this.isUserActive = true;
    });
    
    document.addEventListener('keydown', (e) => {
      this.lastActivity = Date.now();
      this.isUserActive = true;
      
      // Screenshot detection
      if (e.key === 'PrintScreen' || (e.key === 'S' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        this.registerViolation('Screenshot attempt detected', 'high');
      }
    });

    // Tab visibility - core functionality for detecting tab switching
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const now = Date.now();
        
        // Check for rapid switching
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
    });

    // Window focus handling with improved accuracy
    window.addEventListener('blur', () => {
      const now = Date.now();
      
      // Only count blur if user was active and it's been more than the cooldown period
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
    });

    // Window resize monitoring
    window.addEventListener('resize', () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (!isMobile) {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
          this.registerViolation('Developer tools or window resize detected', 'medium');
        }
      }
    });

    // Copy/Paste Prevention
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      this.registerViolation('Copy attempt detected', 'medium');
    });

    document.addEventListener('paste', (e) => {
      e.preventDefault();
      this.registerViolation('Paste attempt detected', 'medium');
    });

    // Context menu prevention
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.registerViolation('Right-click attempt detected', 'low');
    });

    // Storage events
    window.addEventListener('storage', (e) => this.handleStorageChange(e));

    // Add DevTools detection
    this.detectDevTools();
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
    // Remove the reset timers that decrease violation counts
    // This ensures violations are permanent during the assessment session
    
    // Store violation data more frequently to prevent data loss
    setInterval(() => {
      this.secureStoreViolations();
    }, 30000); // Every 30 seconds
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
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      // For desktop: check for significant resizing that might indicate dev tools
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        this.registerViolation('Window significantly resized', 'medium');
      }
    } else {
      // For mobile: only trigger if window becomes extremely small
      // Most mobile devices won't go below these dimensions
      if (window.innerWidth < 280 || window.innerHeight < 400) {
        this.registerViolation('Suspicious window resizing detected', 'medium');
      }
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
    // Use a simple encryption approach
    const dataToStore = JSON.stringify(this._violations.value);
    
    // Basic encryption (in production, use a more robust approach)
    const encoded = this.encryptData(dataToStore);
    
    // Store in multiple locations
    localStorage.setItem('assessment_integrity_data', encoded);
    sessionStorage.setItem('assessment_integrity_data', encoded);
    
    // Add timestamp to make tampering more difficult
    const timestamp = Date.now().toString();
    const hashedTimestamp = this.hashString(timestamp);
    
    localStorage.setItem('assessment_integrity_time', hashedTimestamp);
    sessionStorage.setItem('assessment_integrity_time', hashedTimestamp);
    
    // Use HTTP-only cookie if possible (simulated here)
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
    // Simply return the raw violation objects
    return this._violations.value.map(violation => ({
      type: violation.type,       // Keep the exact violation type
      severity: violation.severity,
      timestamp: violation.timestamp
    }));
  }

  // New method to only clear UI alerts but keep violation tracking
  clearAlerts(): void {
    this._cheatMessage.next(null);
  }

  // Original resetViolations renamed to track it's only called on assessment end
  resetAllViolations() {
    this._violations.next([]);
    this._cheatingCount.next(0);
    this._cheatMessage.next(null);
    
    // Clear all storage mechanisms to ensure complete reset
    localStorage.removeItem('assessment_integrity_data');
    sessionStorage.removeItem('assessment_integrity_data');
    localStorage.removeItem('assessment_integrity_count');
    sessionStorage.removeItem('assessment_integrity_count');
    localStorage.removeItem('assessment_init_time');
    sessionStorage.removeItem('assessment_init_time');
    
    // Clear cookie
    document.cookie = 'assessment_count=0; path=/; max-age=0';
    
    // Re-initialize timestamp
    this.storeTimestamps();
    
    console.log('Integrity monitoring system reset at', new Date().toISOString());
  }

  // Add encryption helper methods
  private encryptData(data: string): string {
    // In production, use a proper encryption library
    // This is a simple obfuscation for demonstration
    const key = "PRISM_ASSESSMENT_SYSTEM";
    let result = btoa(data); // Base64 encode
    
    // Add a checksum
    const checksum = this.hashString(data).substring(0, 8);
    result = checksum + '_' + result;
    
    return result;
  }

  private hashString(str: string): string {
    // Simple hash function for demonstration
    // In production, use a cryptographic hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Detect if DevTools is open
  private detectDevTools() {
    // Method 1: Check for debugger
    const startTime = new Date().getTime();
    debugger; // This gets triggered if DevTools is open
    const endTime = new Date().getTime();
    
    if (endTime - startTime > 100) {
      this.registerViolation('Developer tools detected', 'high');
    }
    
    // Method 2: Console overriding
    const consoleCheck = () => {
      const original = window.console.log;
      window.console.log = (...args) => {
        // Check if being used in DevTools
        const stack = new Error().stack || '';
        if (stack.includes('console-api') || stack.includes('debugger')) {
          this.registerViolation('Console API usage detected', 'medium');
        }
        original(...args);
      };
    };
    
    consoleCheck();
    
    // Periodically check for DevTools (Firefox, Safari)
    setInterval(() => {
      // Check if it's a mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Only check for DevTools on desktop devices
      if (!isMobile) {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
          this.registerViolation('Developer tools potentially detected', 'medium');
        }
      }
    }, 5000);
  }
}
