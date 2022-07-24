import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { OidcService } from '@z-auth/oidc-api-angular';

@Component({
  selector: 'zap-io-root',
  imports: [RouterModule],
  template: `<router-outlet></router-outlet>`,
  standalone: true,
})
export class AppComponent implements OnInit {
  protected auth = inject(OidcService);
  private router = inject(Router);

  ngOnInit(): void {
    this.auth.authResult$.subscribe((x) => {
      console.log('auth complete', x);
    });

    this.auth.isAuthenticated$.subscribe((x) => {
      console.log('isAuthenticated', x);
    });
  }
}
