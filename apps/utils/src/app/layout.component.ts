import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar.component';

@Component({
  selector: 'utils-layout',
  template: `
    <div class="drawer drawer-mobile">
      <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content flex flex-col items-center  border">
        <utils-navbar class="w-full">
          <label
            for="my-drawer-2"
            class="btn btn-primary drawer-button lg:hidden"
            >Open</label
          >
        </utils-navbar>
        <div class="w-full"><router-outlet></router-outlet></div>
      </div>
      <div class="drawer-side">
        <label for="my-drawer-2" class="drawer-overlay"></label>
        <ul
          class="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content "
        >
          <li>
            <a
              class="font-bold"
              [routerLink]="['jwt']"
              [routerLinkActive]="'bg-green-400'"
              >JWT</a
            >
          </li>
          <li>
            <a
              class="font-bold"
              [routerLink]="['date']"
              [routerLinkActive]="'bg-green-400'"
              >Date</a
            >
          </li>
        </ul>
      </div>
    </div>
  `,
  standalone: true,
  imports: [NavbarComponent, RouterModule],
})
export class LayoutComponent {}
