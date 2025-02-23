import { Component } from '@angular/core';
import packageJson from 'package.json';
import { companyName } from 'src/common/constants/miscellaneous';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  companyDisplayName = companyName;

  applicationVersion = packageJson.version;
}
