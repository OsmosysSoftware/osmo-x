import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-footer',
  template: `<div class="layout-footer">
    <a
      href="https://osmosys.co/"
      target="_blank"
      rel="noopener noreferrer"
      class="text-primary font-bold hover:underline"
      >Copyright &copy; 2025 Osmosys Software Solutions</a
    >
    | All Rights Reserved
  </div>`,
})
export class AppFooter {}
