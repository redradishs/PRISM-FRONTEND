import { TestBed } from '@angular/core/testing';

import { BarchartService } from './barchart.service';

describe('BarchartService', () => {
  let service: BarchartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarchartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
