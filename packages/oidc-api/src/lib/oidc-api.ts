import {
  AuthConfig,
  AuthResult,
  createAuthUrl,
  createLogoutUrl,
  createNonce,
  createParamsFromConfig,
  createTokenRequestBody,
  createVerifierAndChallengePair,
  getQueryParams,
  isAuthCallback,
  isHttps,
  QueryParams,
  redirectTo,
  replaceUrlState,
  StateParams,
  validateIdToken,
} from '@z-auth/oidc-utils';
import { AuthenticationState, AuthStateService } from './auth-state-service';
import { DiscoveryService } from './discovery-service';
import { BrowserStorageService } from './storage/browser-storage-service';
import { StorageService } from './storage/storage-service';
import { Event } from './events';
import { getLocalSession } from './cache/cache-service';

export class OIDCApi {
  private discoveryService = new DiscoveryService();
  private authStateService = new AuthStateService();

  constructor(
    private storageService: StorageService = new BrowserStorageService()
  ) {}

  registerEvents(
    authStateEvent?: (authState: AuthenticationState) => void,
    event?: (event: Event) => void
  ) {
    typeof authStateEvent === 'function' &&
      this.authStateService.registerAuthStateHandler(authStateEvent);
    typeof event === 'function' &&
      this.authStateService.registerEventHandler(event);
  }

  login = async (extraParams?: QueryParams) => {
    this.removeLocalSession();
    const state = createNonce(42);
    const [nonce, hashedNonce] = createVerifierAndChallengePair(42);
    const [codeVerifier, codeChallenge] = createVerifierAndChallengePair();
    const config = this.authStateService.getAuthConfig();
    const params = createParamsFromConfig(config, extraParams);
    const mergedParams = {
      nonce,
      codeVerifier,
      sendUserBackTo: window.location.href,
      ...params,
    };
    this.storageService.set('state', state);
    this.storageService.set(state, mergedParams);
    const authUrl = createAuthUrl(
      config.authorizeEndpoint!,
      { ...params, state, nonce: hashedNonce },
      codeChallenge
    );
    redirectTo(authUrl);
  };

  /**
   *
   * @param logoutCb Callback to be called when logout is complete.
   */
  localLogout = () => {
    this.removeLocalSession();
    redirectTo(this.authStateService.getAuthConfig().postLogoutRedirectUri);
  };

  logout = (queryParams?: QueryParams) => {
    const config = this.authStateService.getAuthConfig();
    if (!config.endsessionEndpoint)
      throw new Error('Endsession endpoint is not set!');

    this.removeLocalSession();
    const logoutUrl = createLogoutUrl(config.endsessionEndpoint, queryParams);
    redirectTo(logoutUrl);
  };

  getAccessToken = () => {
    const session = this.getLocalSession();
    if (!session) return null;

    return session.stateParams?.authResult.access_token;
  };

  getIdToken = () => {
    const session = this.getLocalSession();
    if (!session) return null;

    const token = session.stateParams?.authResult.id_token;

    if (!token) return null;
    const isValid = this.hasValidIdToken(token);

    return isValid ? token : null;
  };

  /**
   * Initialize the authentication flow. Loads the discovery document (optionally from config) and stores it in the service. Checks
   * if all of the configs are proprely set.
   * @param authConfig AuthConfig
   * @param authResultCb Callback to be called when auth redirect has been processed and validated. Returns the auth result,
   * if the id token was valid, and returns void if the redirect uri route was loaded without query params.
   */
  initAuth = async (authConfig: AuthConfig): Promise<void> => {
    this.authStateService.setAuthState(AuthenticationState.Authenticating);
    this.authStateService.setAuthConfig(authConfig);

    if (authConfig.discovery == null || authConfig.discovery) {
      const [discoveryDocument, jwks] =
        await this.discoveryService.loadDiscoveryDocument(
          authConfig,
          this.authStateService.emitEvent
        );
      const newConfig = {
        ...authConfig,
        authorizeEndpoint: discoveryDocument.authorization_endpoint,
        tokenEndpoint: discoveryDocument.token_endpoint,
        jwks,
      };
      this.authStateService.setAuthConfig(newConfig);
    }
    this.ensureAllConfigIsLoaded();
    if (authConfig.useHttps !== false) this.tlsCheck();
    try {
      await this.runAuthFlow();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  private hasValidIdToken = (inputToken?: string): boolean => {
    const session = this.getLocalSession();
    if (!session) return false;
    const { stateParams } = session;

    if (!session) return false;
    const { authResult, nonce, max_age } = stateParams;
    const token: string = inputToken ?? (<AuthResult>authResult).id_token;
    const isValid: boolean = validateIdToken(
      token,
      this.authStateService.getAuthConfig(),
      nonce,
      max_age
    );

    return isValid;
  };

  private runAuthFlow = async () => {
    const config = this.authStateService.getAuthConfig();
    if (isAuthCallback(config)) {
      const res = await this.getAuthResult();
      this.evaluateAuthState(res.id_token);
      const session = this.getLocalSession();
      if (!session) throw new Error('Expected session!');
      const { state, stateParams } = session;
      this.storageService.set(state, {
        ...stateParams,
        authResult: res,
      });
      if (stateParams.sendUserBackTo && config.preserveRoute !== false)
        replaceUrlState(stateParams.sendUserBackTo);
      this.authStateService.emitEvent('AuthComplete');
    } else {
      this.evaluateAuthState();
    }
  };

  private getAuthResult = async (): Promise<AuthResult> => {
    const params = getQueryParams();
    this.checkState(params);

    if (params.has('error')) throw new Error(<string>params.get('error'));

    try {
      if (this.authStateService.getAuthConfig().responseType === 'code') {
        const authResult = await this.handleCodeFlowRedirect(params);

        return authResult;
      } else return {} as AuthResult; // until other cases implemented
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  private checkState = (params: URLSearchParams) => {
    const returnedState = params.get('state');
    if (!returnedState) throw new Error('State expected from query params!');
    const storedState = this.storageService.get('state');
    if (storedState !== returnedState) throw new Error('Invalid state!');
  };

  private handleCodeFlowRedirect = async (
    params: URLSearchParams
  ): Promise<AuthResult> => {
    if (!params.has('code')) throw new Error('No code found in query params!');

    const code = <string>params.get('code');
    replaceUrlState(this.authStateService.getAuthConfig().redirectUri);

    try {
      const data = await this.fetchTokensWithCode(code);

      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  private evaluateAuthState = (token?: string) => {
    const authState = this.hasValidIdToken(token)
      ? AuthenticationState.Authenticated
      : AuthenticationState.Unauthenticated;
    this.authStateService.setAuthState(authState);
  };

  private getLocalSession() {
    return getLocalSession(this.storageService);
  }

  private removeLocalSession = () => {
    const state = this.storageService.get<string>('state');
    if (!state) return;
    this.storageService.remove('state');
    this.storageService.remove(state);
    this.authStateService.setAuthState(AuthenticationState.Unauthenticated);
  };

  private fetchTokensWithCode = async (code: string): Promise<AuthResult> => {
    const config = this.authStateService.getAuthConfig();
    const session = this.getLocalSession();
    if (!session) throw new Error('Expected session!');
    const body = createTokenRequestBody(
      config,
      code,
      session?.stateParams.codeVerifier
    );
    try {
      const response = await fetch(config.tokenEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      return response.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  private ensureAllConfigIsLoaded = () => {
    const config = this.authStateService.getAuthConfig();

    if (!config) throw new Error('Missing authConfig');
    if (!config.authorizeEndpoint)
      throw new Error(
        'Authorization endpoint is required, if not using discovery!'
      );
    if (!config.tokenEndpoint)
      throw new Error('Token endpoint is required, if not using discovery!');
    if (!config.jwks) throw new Error('Jwks is required!');
  };

  private tlsCheck = () => {
    const config = this.authStateService.getAuthConfig();
    if (!isHttps(config.issuer))
      throw new Error('TLS check failed for issuer!');
    if (!isHttps(config.authorizeEndpoint!))
      throw new Error('TLS check failed for authorize endpoint!');
    if (!isHttps(config.tokenEndpoint!))
      throw new Error('TLS check failed for token endpoint!');
    if (!isHttps(config.endsessionEndpoint!))
      throw new Error('TLS check failed for end session endpoint!');
  };
}
