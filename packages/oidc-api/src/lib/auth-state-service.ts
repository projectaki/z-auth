import { Event } from './events';

export class AuthStateService {
  private authState = AuthenticationState.Unauthenticated;
  private onAuthStateChange?: (authState: AuthenticationState) => void;
  private onEvent?: (event: Event) => void;

  public getAuthState(): AuthenticationState {
    return this.authState;
  }

  public registerAuthStateHandler = (
    authStateEvent: (authState: AuthenticationState) => void
  ) => {
    this.onAuthStateChange = authStateEvent;
  };

  public registerEventHandler = (event: (event: Event) => void) => {
    this.onEvent = event;
  };

  public setAuthState = (authState: AuthenticationState) => {
    this.authState = authState;
    if (this.onAuthStateChange) this.onAuthStateChange(authState);
  };

  public emitEvent = (event: Event) => {
    if (this.onEvent) this.onEvent(event);
  };
}

export enum AuthenticationState {
  Unauthenticated = 'unauthenticated',
  Authenticating = 'authenticating',
  Authenticated = 'authenticated',
}
