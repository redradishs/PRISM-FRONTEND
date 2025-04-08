import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileInstComponent } from './profile-inst.component';

describe('ProfileInstComponent', () => {
  let component: ProfileInstComponent;
  let fixture: ComponentFixture<ProfileInstComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileInstComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileInstComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
