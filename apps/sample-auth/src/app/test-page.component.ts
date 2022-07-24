import { Component, inject, OnInit } from '@angular/core';
import { OidcService } from '@zap.io/zap-oidc-angular';

@Component({
  selector: 'zap-io-test-page',
  template: ` <button (click)="auth.login()">login</button>`,
  styles: [],
})
export class TestPageComponent {
  protected auth = inject(OidcService);
}
