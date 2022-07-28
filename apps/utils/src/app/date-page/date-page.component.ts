import { Component, OnInit } from '@angular/core';
import { DateComponent } from './date.component';

@Component({
  selector: 'utils-date-page',
  template: `<div class="p-8">
    <utils-date></utils-date>
  </div> `,
  standalone: true,
  imports: [DateComponent],
})
export class DatePageComponent {}
