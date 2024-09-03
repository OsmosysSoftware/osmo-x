import { TestBed } from '@angular/core/testing';
import { Clipboard } from '@angular/cdk/clipboard';
import { MessageService } from 'primeng/api';
import { JsonDialogComponent } from './json-dialog.component';

describe('JsonDialogComponent', () => {
  let component: JsonDialogComponent;
  let clipboardSpy: jasmine.SpyObj<Clipboard>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [JsonDialogComponent],
      providers: [
        { provide: Clipboard, useValue: jasmine.createSpyObj('Clipboard', ['copy']) },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
      ],
    });

    component = TestBed.createComponent(JsonDialogComponent).componentInstance;
    clipboardSpy = TestBed.inject(Clipboard) as jasmine.SpyObj<Clipboard>;
    messageServiceSpy = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  it('should copy JSON data to clipboard and show success message', () => {
    component.jsonData = { key: 'value' };
    clipboardSpy.copy.and.returnValue(true);

    component.copyToClipboard();

    expect(clipboardSpy.copy).toHaveBeenCalledWith(JSON.stringify(component.jsonData));
    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      key: 'tst',
      severity: 'info',
      summary: 'Info',
      detail: 'JSON data copied to clipboard!',
    });
  });

  it('should show error message if copying fails', () => {
    component.jsonData = { key: 'value' };
    clipboardSpy.copy.and.throwError('Copy failed');

    component.copyToClipboard();

    expect(messageServiceSpy.add).toHaveBeenCalledWith({
      key: 'tst',
      severity: 'error',
      summary: 'Error',
      detail: 'There was an error copying JSON data. Reason: Copy failed',
    });
  });
});
