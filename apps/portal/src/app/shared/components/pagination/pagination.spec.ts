import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageInfo, PaginationComponent } from './pagination';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  const pageInfo: PageInfo = { page: 3, limit: 20, total_items: 95, total_pages: 5 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    // pageInfo is input.required, so it must be set before the first change detection.
    fixture.componentRef.setInput('pageInfo', pageInfo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should translate the 1-indexed API page into a 0-indexed first record', () => {
    expect(component.first()).toBe(40);
    expect(component.rows()).toBe(20);
    expect(component.totalRecords()).toBe(95);
  });

  it('should emit a 1-indexed page when the paginator reports a 0-indexed one', () => {
    const pages: number[] = [];

    component.pageChange.subscribe((page) => pages.push(page));
    component.onPageChange({ page: 0, first: 0, rows: 20 });

    expect(pages).toEqual([1]);
  });
});
