import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeatureFlagComponent } from './feature-flag.component';

describe('FeatureFlagComponent', () => {
  let component: FeatureFlagComponent;
  let fixture: ComponentFixture<FeatureFlagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureFlagComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeatureFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
