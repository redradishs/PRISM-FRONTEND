import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmSystemsettingsComponent } from './adm-systemsettings.component';

describe('AdmSystemsettingsComponent', () => {
  let component: AdmSystemsettingsComponent;
  let fixture: ComponentFixture<AdmSystemsettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmSystemsettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmSystemsettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
