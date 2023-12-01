import { NgModule } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';

const modules = [ButtonModule, TableModule, DropdownModule, DialogModule];

@NgModule({
  imports: [...modules],
  exports: [...modules],
})
export class PrimeNgModule {}
