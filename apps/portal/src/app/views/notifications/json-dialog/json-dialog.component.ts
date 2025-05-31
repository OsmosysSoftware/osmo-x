import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-json-dialog',
  templateUrl: './json-dialog.component.html',
  styleUrls: ['./json-dialog.component.scss'],
  standalone: false,
})
export class JsonDialogComponent {
  @Input() jsonData: Record<string, unknown>;

  @Input() visible: boolean;

  @Output() closeDialog = new EventEmitter<void>();

  constructor(
    private clipboard: Clipboard,
    private messageService: MessageService,
  ) {}

  hideDialog(): void {
    this.visible = false;
    this.closeDialog.emit();
  }

  copyToClipboard(): void {
    try {
      this.clipboard.copy(JSON.stringify(this.jsonData));
      // Display info message toast on notifications.component.html
      this.messageService.add({
        key: 'tst',
        severity: 'info',
        summary: 'Info',
        detail: 'JSON data copied to clipboard!',
      });
    } catch (error) {
      this.messageService.add({
        key: 'tst',
        severity: 'error',
        summary: 'Error',
        detail: `There was an error copying JSON data. Reason: ${error.message}`,
      });
    }
  }
}
