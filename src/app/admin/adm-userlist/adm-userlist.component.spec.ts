import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmUserlistComponent } from './adm-userlist.component';

describe('AdmUserlistComponent', () => {
  let component: AdmUserlistComponent;
  let fixture: ComponentFixture<AdmUserlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmUserlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmUserlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
