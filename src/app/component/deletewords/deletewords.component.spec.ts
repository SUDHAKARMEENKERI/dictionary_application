import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletewordsComponent } from './deletewords.component';

describe('DeletewordsComponent', () => {
  let component: DeletewordsComponent;
  let fixture: ComponentFixture<DeletewordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletewordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletewordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
