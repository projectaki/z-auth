import { inject, Injectable } from '@angular/core';
import {
  AuthenticationState,
  BrowserStorageService,
  OIDCApi,
  QueryParams,
} from 'libs/oidc-client/src';
import { catchError, of, ReplaySubject, throwError } from 'rxjs';
import { AUTH_CONFIG } from './injection-token';
import { Event } from 'libs/oidc-client/src';

@Injectable({
  providedIn: 'root',
})
export class OidcService {
  private config = inject(AUTH_CONFIG);
  auth = new OIDCApi(new BrowserStorageService());

  private authState = new ReplaySubject<AuthenticationState>(1);
  public authState$ = this.authState.asObservable();

  private events = new ReplaySubject<Event>(1);
  public events$ = this.events.asObservable();

  login = (params?: QueryParams) => {
    this.auth.login(params);
  };

  logout = (queryParams?: QueryParams) => {
    this.auth.logout(queryParams);
  };

  localLogout = () => {
    this.auth.localLogout();
  };

  initAuth = () => {
    this.auth.registerEvents(this.authStateChangeCb, this.eventCb);
    return this.auth.initAuth(this.config);
  };

  getAccessToken = () => {
    return of(this.auth.getAccessToken());
  };

  getIdToken = () => {
    return of(this.auth.getIdToken()).pipe(
      catchError(() => {
        this.authState.next(AuthenticationState.Unauthenticated);

        return throwError(() => 'No id token found');
      })
    );
  };

  getRefreshToken = () => {
    return of(this.auth.getRefreshToken());
  };

  refreshTokens() {
    return {};
  }

  private authStateChangeCb: (authState: AuthenticationState) => void = (x) => {
    this.authState.next(x);
  };

  private eventCb: (event: Event) => void = (x) => {
    this.events.next(x);
  };

  createIframeAndListener() {
    this.auth.createIframeAndListener();
  }
}
