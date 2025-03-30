import { TestBed } from '@angular/core/testing';

import { IntegrityMonitoringService } from './integrity-monitoring.service';

describe('IntegrityMonitoringService', () => {
  let service: IntegrityMonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntegrityMonitoringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
