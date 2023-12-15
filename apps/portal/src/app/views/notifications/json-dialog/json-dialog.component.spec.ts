import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JsonDialogComponent } from './json-dialog.component';

describe('JsonDialogComponent', () => {
  let component: JsonDialogComponent;
  let fixture: ComponentFixture<JsonDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JsonDialogComponent],
    });
    fixture = TestBed.createComponent(JsonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
