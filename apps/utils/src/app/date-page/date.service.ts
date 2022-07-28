import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  convertSEpochToDate(epochMs: number): Date {
    return new Date(epochMs * 1000);
  }

  convertDateToSEpoch(date: Date): number {
    return date.getTime() / 1000;
  }

  convertDateToString(date: Date): string {
    return date.toDateString();
  }

  convertStringToDate(dateString: string): Date {
    return new Date(dateString);
  }

  convertStringToEpochInSeconds(dateString: string): number {
    return this.convertDateToSEpoch(this.convertStringToDate(dateString));
  }

  convertDateToUtcString(date: Date): string {
    return date.toUTCString();
  }

  validateDate(date: string): boolean {
    return !isNaN(Date.parse(date));
  }
}
