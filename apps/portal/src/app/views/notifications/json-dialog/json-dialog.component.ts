import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-json-dialog',
  templateUrl: './json-dialog.component.html',
  styleUrls: ['./json-dialog.component.scss'],
})
export class JsonDialogComponent {
  @Input() jsonData: Record<string, unknown>;

  @Input() visible: boolean;

  @Output() closeDialog = new EventEmitter<void>();

  hideDialog(): void {
    this.visible = false;
    this.closeDialog.emit();
  }
}
