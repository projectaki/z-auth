import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  EMPTY,
  of,
  Subject,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { ToastService } from '../core/toast.service';
import { DateService } from './date.service';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { StorageService } from '../core/storage.service';

@Component({
  selector: 'utils-date',
  template: `<div class="flex flex-col gap-2">
    <div class="flex gap-4">
      <input
        type="number"
        placeholder="Epoch (MS) to date"
        class="input input-bordered input-info w-full max-w-xs"
        [formControl]="epochInSeconds"
      />
      <div
        *ngIf="epochToUtcString"
        class="flex justify-center items-center hover:cursor-pointer hover:shadow-[0_0_1px_1px] hover:shadow-green-300 hover:rounded-md p-2"
        [cdkCopyToClipboard]="epochToUtcString"
        (click)="copied(epochToUtcString)"
      >
        {{ epochToUtcString }}
      </div>
      <div class="flex justify-center items-center">
        {{ epochToUtcString && epochToIsoString ? ' | ' : '' }}
      </div>
      <div
        class="flex justify-center items-center hover:cursor-pointer hover:shadow-[0_0_1px_1px] hover:shadow-green-300 hover:rounded-md p-2"
        [cdkCopyToClipboard]="epochToIsoString"
        (click)="copied(epochToIsoString)"
      >
        {{ epochToIsoString }}
      </div>
    </div>
    <div class="flex gap-4">
      <input
        [formControl]="dateString"
        type="text"
        placeholder="Date to Epoch (MS)"
        class="input input-bordered input-info w-full max-w-xs"
      />
      <div
        class="flex justify-center items-center hover:cursor-pointer hover:shadow-[0_0_1px_1px] hover:shadow-green-300 hover:rounded-md p-2"
        [cdkCopyToClipboard]="dateToEpochInSeconds"
        (click)="copied(dateToEpochInSeconds)"
      >
        {{ dateToEpochInSeconds }}
      </div>
    </div>
  </div> `,
  standalone: true,
  imports: [ReactiveFormsModule, ClipboardModule, CommonModule],
})
export class DateComponent implements OnInit {
  epochInSeconds = new FormControl<number | null>(null);
  epochToUtcString!: string;
  epochToIsoString!: string;

  dateString = new FormControl<string | null>(null);
  dateToEpochInSeconds!: string;

  private unsub$ = new Subject<void>();

  constructor(
    private dateService: DateService,
    private toastService: ToastService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.epochInSeconds.valueChanges
      .pipe(
        tap((epochMs) => {
          if (!epochMs) {
            this.epochToUtcString = '';
            this.epochToIsoString = '';
            return;
          }
          try {
            this.epochToUtcString = this.dateService
              .convertSEpochToDate(epochMs)
              .toUTCString();
            this.epochToIsoString = this.dateService
              .convertSEpochToDate(epochMs)
              .toISOString();
            if (this.epochInSeconds)
              this.storageService.setValue(
                'epochInSeconds',
                this.epochInSeconds.value
              );
          } catch (e: any) {
            this.toastService.error(e.message);
          }
        }),
        takeUntil(this.unsub$)
      )
      .subscribe();

    this.dateString.valueChanges
      .pipe(takeUntil(this.unsub$))
      .subscribe((dateString) => {
        if (!dateString) {
          this.dateToEpochInSeconds = '';
          return;
        }
        this.dateToEpochInSeconds = this.dateService
          .convertStringToEpochInSeconds(dateString)
          .toString();
        if (this.dateString)
          this.storageService.setValue('dateString', this.dateString.value);
      });

    this.setCachedEvent();
  }

  ngOnDestroy(): void {
    this.unsub$.next();
    this.unsub$.complete();
  }

  copied(text: string): void {
    this.toastService.success(`Copied to clipboard: ${text}`);
  }

  private setCachedEvent() {
    const epochInSeconds =
      this.storageService.getValue<number>('epochInSeconds');
    if (epochInSeconds) this.epochInSeconds.setValue(epochInSeconds);

    const dateString = this.storageService.getValue<string>('dateString');
    if (dateString) this.dateString.setValue(dateString);
  }
}
