import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastModule } from 'primeng/toast';
import { ReactiveFormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

const modules = [
  ButtonModule,
  TableModule,
  DropdownModule,
  DialogModule,
  ToastModule,
  ReactiveFormsModule,
  PasswordModule,
  InputTextModule,
  BrowserAnimationsModule,
  TagModule,
  ProgressSpinnerModule,
];

@NgModule({
  imports: [...modules],
  exports: [...modules],
})
export class PrimeNgModule {}
