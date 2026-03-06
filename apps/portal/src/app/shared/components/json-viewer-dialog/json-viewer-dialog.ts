import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-json-viewer-dialog',
  imports: [JsonPipe, DialogModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './json-viewer-dialog.html',
  styleUrl: './json-viewer-dialog.scss',
})
export class JsonViewerDialog {
  private readonly clipboard = inject(Clipboard);
  private readonly messageService = inject(MessageService);

  readonly visible = input(false);
  readonly data = input<Record<string, unknown> | null>(null);
  readonly header = input('JSON Data');
  readonly visibleChange = output<boolean>();

  onHide(): void {
    this.visibleChange.emit(false);
  }

  copyToClipboard(): void {
    const json = JSON.stringify(this.data(), null, 2);

    this.clipboard.copy(json);
    this.messageService.add({
      severity: 'info',
      summary: 'Copied',
      detail: 'JSON copied to clipboard',
    });
  }
}
