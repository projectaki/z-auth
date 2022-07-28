import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { validateAtHash } from '@z-auth/oidc-utils';
import {
  catchError,
  combineLatest,
  debounceTime,
  filter,
  of,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { StorageService } from '../core/storage.service';
import { ToastService } from '../core/toast.service';
import { JWT } from './jwt';
import { JwtService } from './jwt.service';

@Component({
  selector: 'utils-jwt',
  template: `
    <form [formGroup]="input" class="h-full flex justify-center items-center ">
      <div class="flex flex-col gap-2 p-4 w-full">
        <div class="flex gap-2 justify-between">
          <textarea
            formControlName="input"
            type=""
            class="border border-slate-300 rounded-md flex-1 h-72 resize-none p-2 min-h-[700px]"
            [ngClass]="{ 'bg-red-100': !this.input.value.input.length }"
          ></textarea>
          <div
            type="text"
            class="border flex-1 border-slate-300 rounded-md min-h-[700px]"
          >
            <div class="border-b border-slate-300 p-1">Header</div>
            <pre class="p-2">{{ jwt.header | json }}</pre>
            <div class="border-b border-t border-slate-300 p-1">Payload</div>
            <pre class="p-2">{{ jwt.payload | json }}</pre>
          </div>
        </div>
        <h2>At hash validation</h2>
        <div class="flex gap-1">
          <input
            type="text"
            placeholder="Id token"
            class="input input-bordered input-info w-full max-w-xs"
            formControlName="idToken"
          />
          <input
            type="text"
            placeholder="Access token"
            class="input input-bordered input-info w-full max-w-xs"
            formControlName="accessToken"
          />
          <div
            class="flex justify-center items-center"
            *ngIf="atHashValid !== null"
          >
            <div *ngIf="atHashValid">✅</div>
            <div *ngIf="!atHashValid">❌</div>
          </div>
        </div>
      </div>
    </form>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class JwtComponent implements OnInit {
  input: FormGroup;
  jwt: JWT = {
    header: {},
    payload: {},
    signature: '',
  };
  atHashValid: boolean | null = null;

  private unsub$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private jwtService: JwtService,
    private storageService: StorageService
  ) {
    this.input = this.fb.group({
      input: '',
      idToken: '',
      accessToken: '',
    });
  }

  ngOnInit(): void {
    this.input.valueChanges
      .pipe(debounceTime(200), takeUntil(this.unsub$))
      .subscribe(() => {
        this.decodeJwt();
        this.cacheEvent();
      });
    this.setCachedEvent();
    this.atHashSub();
  }

  ngOnDestroy(): void {
    this.unsub$.next();
    this.unsub$.complete();
  }

  atHashSub() {
    combineLatest([
      this.input.controls['idToken'].valueChanges.pipe(
        debounceTime(400),
        tap((x: string) => {
          try {
            this.jwtService.decodeJWt(x);
          } catch (e) {
            this.toastService.error('Invalid id token');
            this.atHashValid = false;
          }
        })
      ),
      this.input.controls['accessToken'].valueChanges.pipe(
        debounceTime(400),
        tap((x: string) => {
          try {
            this.jwtService.decodeJWt(x);
          } catch (e) {
            this.toastService.error('Invalid access token');
            this.atHashValid = false;
          }
        })
      ),
    ])
      .pipe(
        filter(([idToken, accessToken]) => !!idToken && !!accessToken),
        tap(([idToken, accessToken]) => {
          try {
            validateAtHash(<string>idToken, <string>accessToken);
            this.atHashValid = true;
          } catch (e) {
            this.atHashValid = false;
          }
        }),
        takeUntil(this.unsub$)
      )
      .subscribe();
  }

  decodeJwt() {
    if (!this.input.value.input.length) return;
    try {
      const jwt = this.jwtService.decodeJWt(this.input.value.input);
      this.jwt = jwt;
    } catch (e: any) {
      this.toastService.error(e.message);
    }
  }

  private setCachedEvent() {
    const value = this.storageService.getValue<string>('jwt');
    if (value) this.input.setValue({ input: value });
  }

  private cacheEvent() {
    if (this.jwt) this.storageService.setValue('jwt', this.input.value.input);
  }
}
