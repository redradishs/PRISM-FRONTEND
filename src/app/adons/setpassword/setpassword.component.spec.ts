import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetpasswordComponent } from './setpassword.component';

describe('SetpasswordComponent', () => {
  let component: SetpasswordComponent;
  let fixture: ComponentFixture<SetpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetpasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
