import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  success(msg?: string) {
    this.toastr.success(msg ?? 'Success', 'Success');
  }

  error(msg?: string) {
    this.toastr.error(msg ?? 'Unknown Error', 'Error');
  }
}
