import { AuthConfig } from '@z-auth/oidc-utils';
import { Event } from './events';

export class AuthStateService {
  private authState = AuthenticationState.Unauthenticated;
  private authConfig!: AuthConfig;
  private authStateEvent?: (authState: AuthenticationState) => void;
  private event?: (event: Event) => void;

  public getAuthState(): AuthenticationState {
    return this.authState;
  }

  public getAuthConfig(): AuthConfig {
    return this.authConfig;
  }

  public registerAuthStateHandler = (
    authStateEvent: (authState: AuthenticationState) => void
  ) => {
    this.authStateEvent = authStateEvent;
  };

  public registerEventHandler = (event: (event: Event) => void) => {
    this.event = event;
  };

  public setAuthState = (authState: AuthenticationState) => {
    this.authState = authState;
    if (this.authStateEvent) this.authStateEvent(authState);
  };

  public emitEvent = (event: Event) => {
    if (this.event) this.event(event);
  };

  public setAuthConfig(authConfig: AuthConfig) {
    this.authConfig = authConfig;
  }
}

export enum AuthenticationState {
  Unauthenticated = 'unauthenticated',
  Authenticating = 'authenticating',
  Authenticated = 'authenticated',
}
