import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { OidcService } from '@z-auth/oidc-client-angular';

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
    this.auth.authState$.subscribe((x) => {
      console.log('auth state', x);
    });

    this.auth.events$.subscribe((x) => {
      console.log('auth event', x);
    });
  }
}
