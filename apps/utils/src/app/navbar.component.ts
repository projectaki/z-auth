import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'utils-navbar',
  template: `
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-brand"></div>
      <div class="flex-auto"></div>
      <div class="navbar-item"><ng-content></ng-content></div>
    </div>
  `,
  standalone: true,
})
export class NavbarComponent {}
