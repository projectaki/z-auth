import { Component, OnInit } from '@angular/core';
import { JwtComponent } from './jwt.component';

@Component({
  selector: 'utils-jwt-page',
  template: ` <utils-jwt class="w-full"></utils-jwt> `,
  imports: [JwtComponent],
  standalone: true,
})
export class JwtPageComponent {}
