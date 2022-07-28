import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'utils-root',
  template: `<div class="w-full"><router-outlet></router-outlet></div>`,
  standalone: true,
  imports: [RouterModule],
})
export class AppComponent {
  title = 'dev-helper';
}
