import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from '@openng/optimus-ui/api';
import { ConfigService } from '../../../core/services/config.service';
import { ProfileComponent } from './profile';

describe('ProfileComponent', () => {
  const apiUrl = 'http://localhost:3000';

  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: ConfigService, useValue: { apiUrl, apiDocsUrl: `${apiUrl}/docs` } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    // ngOnInit loads the profile; answer that request so verify() stays clean.
    httpMock.expectOne(`${apiUrl}/auth/me`).flush({
      user: { email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' },
    });

    expect(component).toBeTruthy();
  });

  it('should populate the form from the loaded profile and clear the loading flag', () => {
    httpMock.expectOne(`${apiUrl}/auth/me`).flush({
      user: { email: 'ada@example.com', first_name: 'Ada', last_name: 'Lovelace' },
    });

    expect(component.email()).toBe('ada@example.com');
    expect(component.firstName()).toBe('Ada');
    expect(component.lastName()).toBe('Lovelace');
    expect(component.loading()).toBeFalse();
    expect(component.hasChanges()).toBeFalse();
  });

  it('should clear the loading flag when the profile request fails', () => {
    httpMock
      .expectOne(`${apiUrl}/auth/me`)
      .flush({ detail: 'nope' }, { status: 500, statusText: 'Server Error' });

    expect(component.loading()).toBeFalse();
  });
});
