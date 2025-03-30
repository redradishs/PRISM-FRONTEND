import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test',
  imports: [CommonModule, FormsModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent implements OnInit {
  cheatingCount = 0;
  cheatMessage: string | null = null;
  private lastActivity = Date.now();
  private inactivityThreshold = 180000; // 3 minutes (more lenient)
  private readonly VIOLATION_EXPIRY = 300000; // 5 minutes
  private violations: {type: string, timestamp: number, severity: string}[] = [];
  
  // Track tab switches with higher allowance
  private tabSwitchCount = 0;
  private readonly TAB_SWITCH_ALLOWANCE = 5; // Increased from 3 to 5
  private tabSwitchResetTimer: any;
  
  // Track alt+tab usage with higher allowance
  private altTabCount = 0;
  private readonly ALT_TAB_ALLOWANCE = 4; // Increased from 2 to 4
  private altTabResetTimer: any;
  
  // Track window blur events with longer cooldown
  private lastBlurTime = 0;
  private readonly BLUR_COOLDOWN = 20000; // 20 seconds (increased from 10)
  
  // Track storage deletion attempts
  private storageLastChecked = Date.now();
  private storageCheckInterval: any;
  
  // Pattern detection for intentional vs accidental behavior
  private rapidActionCount = 0;
  private lastActionTime = 0;
  private readonly RAPID_ACTION_THRESHOLD = 3000; // 3 seconds

  constructor(private ngZone: NgZone) { 
    this.loadCheatingCount();
    
    // Set up storage monitoring
    this.monitorStorageDeletion();
  }

  ngOnInit() {
    // Start monitoring for inactivity
    this.startInactivityMonitor();
    
    // Track activity to reset inactivity timer
    document.addEventListener('mousemove', () => {
      this.lastActivity = Date.now();
    });
    document.addEventListener('keydown', () => {
      this.lastActivity = Date.now();
    });
    
    // Add storage event listener to detect changes
    window.addEventListener('storage', (e) => {
      this.handleStorageChange(e);
    });
    
    // Set up reset timers for accidental actions
    this.setupAccidentalActionResets();
  }
  
  ngOnDestroy() {
    // Clear intervals when component is destroyed
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
  
  // Set up timers to reset accidental action counters
  private setupAccidentalActionResets() {
    // Reset tab switch count after 2 minutes of good behavior
    this.tabSwitchResetTimer = setInterval(() => {
      if (this.tabSwitchCount > 0 && this.tabSwitchCount <= this.TAB_SWITCH_ALLOWANCE) {
        this.tabSwitchCount = Math.max(0, this.tabSwitchCount - 1);
      }
    }, 120000); // 2 minutes
    
    // Reset alt+tab count after 2 minutes of good behavior
    this.altTabResetTimer = setInterval(() => {
      if (this.altTabCount > 0 && this.altTabCount <= this.ALT_TAB_ALLOWANCE) {
        this.altTabCount = Math.max(0, this.altTabCount - 1);
      }
    }, 120000); // 2 minutes
  }

  private startInactivityMonitor() {
    setInterval(() => {
      this.ngZone.run(() => {
        const now = Date.now();
        if (now - this.lastActivity > this.inactivityThreshold) {
          // Only register if extremely inactive (double the threshold)
          if (now - this.lastActivity > this.inactivityThreshold * 2) {
            this.registerViolation('Extended inactivity detected', 'medium');
          } else {
            this.showWarning('Inactivity detected - please continue your assessment');
          }
          this.lastActivity = now; // Reset to prevent multiple alerts
        }
      });
    }, 60000); // Check every minute
  }
  
  // Monitor for storage deletion attempts
  private monitorStorageDeletion() {
    // Store initial timestamp in multiple formats
    this.storeTimestamps();
    
    // Check periodically if storage has been tampered with
    this.storageCheckInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.checkStorageIntegrity();
      });
    }, 10000); // Check every 10 seconds (reduced frequency)
  }
  
  // Store timestamps in multiple formats and locations
  private storeTimestamps() {
    const now = Date.now();
    localStorage.setItem('assessment_init_time', now.toString());
    localStorage.setItem('assessment_init_time_encoded', btoa(now.toString()));
    sessionStorage.setItem('assessment_init_time', now.toString());
    
    // Store the last checked time
    this.storageLastChecked = now;
  }
  
  // Check if storage has been tampered with
  private checkStorageIntegrity() {
    // Check if our integrity data exists
    const integrityData = localStorage.getItem('assessment_integrity_data');
    const integrityChecksum = localStorage.getItem('assessment_integrity_checksum');
    const initTime = localStorage.getItem('assessment_init_time');
    const initTimeEncoded = localStorage.getItem('assessment_init_time_encoded');
    const sessionInitTime = sessionStorage.getItem('assessment_init_time');
    
    // If any of these are missing but we had violations, storage was likely cleared
    if (this.cheatingCount > 0 && (!integrityData || !integrityChecksum)) {
      this.handleStorageDeletion();
      return;
    }
    
    // Check for timestamp inconsistencies
    if (initTime && initTimeEncoded && sessionInitTime) {
      // Decode the encoded timestamp
      try {
        const decodedTime = atob(initTimeEncoded);
        
        // If timestamps don't match, storage was tampered with
        if (initTime !== decodedTime || initTime !== sessionInitTime) {
          this.handleStorageTampering();
        }
      } catch (e) {
        // Error decoding - likely tampering
        this.handleStorageTampering();
      }
    } else if (this.cheatingCount > 0) {
      // Missing timestamps but we had violations
      this.handleStorageDeletion();
    }
  }
  
  // Handle storage event changes
  private handleStorageChange(e: StorageEvent) {
    // If our integrity keys were changed or removed
    if (e.key === 'assessment_integrity_data' || 
        e.key === 'assessment_integrity_checksum' ||
        e.key === 'assessment_init_time' ||
        e.key === 'assessment_init_time_encoded') {
      
      // If the key was removed
      if (!e.newValue) {
        this.handleStorageDeletion();
      } 
      // If the key was changed unexpectedly
      else if (e.key === 'assessment_integrity_data' && this.violations.length > 0) {
        this.verifyIntegrityData();
      }
    }
  }
  
  // Handle storage deletion
  private handleStorageDeletion() {
    // Register a severe violation
    this.registerViolation('Storage data deletion detected', 'high');
    
    // Restore our data
    this.secureStoreViolations();
    this.storeTimestamps();
    
    // Show a message
    this.cheatMessage = 'Warning: Attempting to clear browser data is detected and logged';
  }
  
  // Handle storage tampering
  private handleStorageTampering() {
    this.registerViolation('Storage data tampering detected', 'high');
    
    // Restore our data
    this.secureStoreViolations();
    this.storeTimestamps();
  }
  
  // Verify integrity data hasn't been tampered with
  private verifyIntegrityData() {
    const encoded = localStorage.getItem('assessment_integrity_data');
    const storedChecksum = localStorage.getItem('assessment_integrity_checksum');
    
    if (encoded && storedChecksum) {
      const calculatedChecksum = this.simpleChecksum(encoded);
      
      if (calculatedChecksum !== storedChecksum) {
        this.handleStorageTampering();
      }
    }
  }

  @HostListener('document:visibilitychange', ['$event'])
  handleVisibilityChange() {
    if (document.hidden) {
      // Check if this is a rapid tab switch (pattern of intentional behavior)
      const now = Date.now();
      if (now - this.lastActionTime < this.RAPID_ACTION_THRESHOLD) {
        this.rapidActionCount++;
      } else {
        this.rapidActionCount = 1;
      }
      this.lastActionTime = now;
      
      // Increment tab switch count
      this.tabSwitchCount++;
      
      // If rapid switching or exceeding allowance, flag as violation
      if (this.rapidActionCount >= 3 || this.tabSwitchCount > this.TAB_SWITCH_ALLOWANCE) {
        // Only register as violation if it's a pattern of behavior
        if (this.rapidActionCount >= 3) {
          this.registerViolation('Rapid tab switching detected', 'high');
        } else {
          this.registerViolation('Excessive tab switching detected', 'medium');
        }
      } else {
        // Just show a warning for occasional switches
        this.showWarning(`Tab switch detected (${this.tabSwitchCount}/${this.TAB_SWITCH_ALLOWANCE} allowed)`);
      }
    }
  }

  @HostListener('window:blur', ['$event'])
  onWindowBlur() {
    const now = Date.now();
    // Only register if not within cooldown period
    if (now - this.lastBlurTime > this.BLUR_COOLDOWN) {
      this.lastBlurTime = now;
      // Just show a warning, don't count as violation
      this.showWarning('Window focus lost - please stay in the assessment window');
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    // Only flag extreme resizing that suggests split-screen
    if (window.innerWidth < 500 || window.innerHeight < 300) {
      this.registerViolation('Window significantly resized', 'medium');
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Detect Alt+Tab specifically
    if (event.altKey && event.key === 'Tab') {
      // Check if this is a rapid alt+tab (pattern of intentional behavior)
      const now = Date.now();
      if (now - this.lastActionTime < this.RAPID_ACTION_THRESHOLD) {
        this.rapidActionCount++;
      } else {
        this.rapidActionCount = 1;
      }
      this.lastActionTime = now;
      
      this.altTabCount++;
      
      // If rapid alt+tabbing or exceeding allowance, flag as violation
      if (this.rapidActionCount >= 3 || this.altTabCount > this.ALT_TAB_ALLOWANCE) {
        // Only register as violation if it's a pattern of behavior
        if (this.rapidActionCount >= 3) {
          this.registerViolation('Rapid Alt+Tab switching detected', 'high');
        } else {
          this.registerViolation('Excessive Alt+Tab detected', 'medium');
        }
      } else {
        // Just show a warning for occasional alt+tabs
        this.showWarning(`Alt+Tab detected (${this.altTabCount}/${this.ALT_TAB_ALLOWANCE} allowed)`);
      }
    }
    
    // Detect screenshot attempts (PrintScreen key)
    if (event.key === 'PrintScreen') {
      this.registerViolation('Screenshot attempt detected', 'high');
      return false;
    }
    
    return true;
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: BeforeUnloadEvent) {
    // Warn before leaving the page
    event.returnValue = 'Are you sure you want to leave? Your progress may be lost.';
    return event.returnValue;
  }

  // Show warning without registering a violation
  showWarning(message: string) {
    this.cheatMessage = `Warning: ${message}`;
    console.warn(this.cheatMessage);
    
    // Clear message after a few seconds
    setTimeout(() => {
      if (this.cheatMessage === `Warning: ${message}`) {
        this.cheatMessage = null;
      }
    }, 5000);
  }

  // Register a violation
  registerViolation(reason: string, severity: string) {
    // Add to violations list with timestamp
    this.violations.push({
      type: reason,
      timestamp: Date.now(),
      severity: severity
    });
    
    this.updateCheatingCount();
    
    this.cheatMessage = `Integrity Alert: ${reason}. This activity has been logged.`;
    
    // Store violations in multiple formats to prevent tampering
    this.secureStoreViolations();

    console.warn(this.cheatMessage);
  }
  
  // Update the cheating count based on violations
  private updateCheatingCount() {
    // Remove expired violations
    const now = Date.now();
    this.violations = this.violations.filter(v => now - v.timestamp < this.VIOLATION_EXPIRY);
    
    // Count all violations
    this.cheatingCount = this.violations.length;
    
    // Store count in multiple ways
    this.secureStoreCheatingCount();
  }

  // Secure storage methods to prevent tampering
  private secureStoreViolations() {
    // Store in localStorage with encoding
    const encoded = btoa(JSON.stringify(this.violations));
    localStorage.setItem('assessment_integrity_data', encoded);
    
    // Store a checksum
    const checksum = this.simpleChecksum(encoded);
    localStorage.setItem('assessment_integrity_checksum', checksum);
    
    // Also store in sessionStorage as backup
    sessionStorage.setItem('assessment_integrity_data', encoded);
    sessionStorage.setItem('assessment_integrity_checksum', checksum);
    
    // Store count in cookie as another backup
    document.cookie = `assessment_count=${this.cheatingCount};path=/;max-age=86400`;
  }
  
  private secureStoreCheatingCount() {
    localStorage.setItem('assessment_integrity_count', btoa(this.cheatingCount.toString()));
    sessionStorage.setItem('assessment_integrity_count', btoa(this.cheatingCount.toString()));
  }
  
  // Simple checksum function
  private simpleChecksum(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  loadCheatingCount() {
    try {
      // Try to load from localStorage first
      let encoded = localStorage.getItem('assessment_integrity_data');
      let storedChecksum = localStorage.getItem('assessment_integrity_checksum');
      
      // If not in localStorage, try sessionStorage
      if (!encoded || !storedChecksum) {
        encoded = sessionStorage.getItem('assessment_integrity_data');
        storedChecksum = sessionStorage.getItem('assessment_integrity_checksum');
      }
      
      // If still not found, try to get count from cookie
      if (!encoded || !storedChecksum) {
        const cookieMatch = document.cookie.match(/assessment_count=(\d+)/);
        if (cookieMatch && cookieMatch[1]) {
          this.cheatingCount = parseInt(cookieMatch[1], 10);
          
          // If we found a count in cookie but not in storage, storage was likely cleared
          if (this.cheatingCount > 0) {
            this.registerViolation("Storage data deletion detected", "high");
            return;
          }
        }
      }
      
      if (encoded && storedChecksum) {
        // Verify checksum to detect tampering
        const calculatedChecksum = this.simpleChecksum(encoded);
        
        if (calculatedChecksum === storedChecksum) {
          // Data is valid
          this.violations = JSON.parse(atob(encoded));
          
          // Remove expired violations
          const now = Date.now();
          this.violations = this.violations.filter(v => now - v.timestamp < this.VIOLATION_EXPIRY);
          
          // Count all violations
          this.cheatingCount = this.violations.length;
        } else {
          // Checksum failed - possible tampering
          console.warn("Integrity data may have been tampered with");
          this.registerViolation("Possible tampering with integrity data detected", "high");
          this.violations = [];
          this.cheatingCount = 1; // Start with 1 violation for the tampering
        }
      } else {
        // No data found - first time or cleared
        this.violations = [];
        this.cheatingCount = 0;
      }
    } catch (e) {
      // Error in parsing - possible tampering
      console.error("Error loading integrity data", e);
      this.registerViolation("Error loading integrity data", "medium");
      this.violations = [];
      this.cheatingCount = 1;
    }
  }

  // Method to get detailed violation history
  getViolationHistory(): string {
    return this.violations.map(v => 
      `${new Date(v.timestamp).toLocaleTimeString()}: ${v.type} (${v.severity})`
    ).join('\n');
  }
}
