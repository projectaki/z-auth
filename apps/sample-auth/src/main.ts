import {
  APP_INITIALIZER,
  enableProdMode,
  importProvidersFrom,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { HttpClientModule } from '@angular/common/http';

import { environment } from './environments/environment';
import { RouterModule } from '@angular/router';
import { routes } from './app/routes';
import { authConfig } from './app/auth.config';
import { AUTH_CONFIG, OidcService } from '@z-auth/oidc-client-angular';

if (environment.production) {
  enableProdMode();
}
console.log('starting app');
bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(RouterModule.forRoot(routes)),
    importProvidersFrom(HttpClientModule),
    OidcService,
    {
      provide: AUTH_CONFIG,
      useValue: authConfig,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: OidcService) => () => auth.initAuth(),
      deps: [OidcService],
      multi: true,
    },
  ],
}).catch((err) => console.error(err));
