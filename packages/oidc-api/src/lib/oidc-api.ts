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
  validateIdToken,
} from '@z-auth/oidc-utils';
import { AuthenticationState, AuthStateService } from './auth-state-service';
import { DiscoveryService } from './discovery-service';
import { BrowserStorageService } from './storage/browser-storage-service';
import { StorageService } from './storage/storage-service';
import { Event } from './events';
import { CacheService } from './cache-service';

export class OIDCApi {
  private authStateService = new AuthStateService();
  private cacheService: CacheService;
  private discoveryService?: DiscoveryService;

  constructor(
    storageService: StorageService = new BrowserStorageService(),
    private authConfig: AuthConfig = {} as AuthConfig
  ) {
    this.cacheService = new CacheService(storageService);
  }

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
    const params = createParamsFromConfig(this.authConfig, extraParams);
    const mergedParams = {
      nonce,
      codeVerifier,
      sendUserBackTo: window.location.href,
      ...params,
    };
    this.cacheService.set('state', state);
    this.cacheService.set(state, mergedParams);
    const authUrl = createAuthUrl(
      this.authConfig.authorizeEndpoint!,
      { ...params, state, nonce: hashedNonce },
      codeChallenge
    );
    redirectTo(authUrl);
  };

  localLogout = () => {
    this.removeLocalSession();
    redirectTo(this.authConfig.postLogoutRedirectUri);
  };

  logout = (queryParams?: QueryParams) => {
    const config = this.authConfig;
    if (!config.endsessionEndpoint)
      throw new Error('Endsession endpoint is not set!');

    this.removeLocalSession();
    const logoutUrl = createLogoutUrl(config.endsessionEndpoint, queryParams);
    redirectTo(logoutUrl);
  };

  getAccessToken = () => {
    return this.getAuthResult()?.access_token;
  };

  getIdToken = () => {
    const authResult = this.getAuthResult();

    const token = authResult?.id_token;

    return token ? (this.hasValidIdToken(token) ? token : null) : null;
  };

  initAuth = async (authConfig: AuthConfig): Promise<void> => {
    this.authConfig = authConfig;
    await this.loadDiscoveryIfEnabled();
    this.ensureAllConfigIsLoaded();
    this.tlsCheckIfEnabled();
    try {
      await this.runAuthFlow();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  private getAuthResult = () => {
    const authResult = this.cacheService.get<AuthResult>('authResult');
    if (!authResult) return null;

    return authResult;
  };

  private getAppState = () => {
    const state = this.cacheService.get<string>('state');
    if (!state) return null;
    const appState = this.cacheService.get<any>(state);
    if (!appState) return null;

    return appState;
  };

  private async loadDiscoveryIfEnabled() {
    if (this.authConfig.discovery !== false) {
      this.discoveryService = new DiscoveryService(
        this.authConfig,
        this.cacheService,
        this.authStateService
      );

      const discoveryDocument =
        await this.discoveryService.loadDiscoveryDocument();
      const newConfig = {
        ...this.authConfig,
        authorizeEndpoint: discoveryDocument.authorization_endpoint,
        tokenEndpoint: discoveryDocument.token_endpoint,
        jwks: discoveryDocument.jwks,
      };
      this.authConfig = newConfig;
    }
  }

  private hasValidIdToken = (inputToken?: string): boolean => {
    const cache = this.cacheService.getAll();
    if (!cache) return false;
    const token = inputToken ?? cache.authResult?.id_token;
    if (!token) return false;

    const isValid: boolean = validateIdToken(
      token,
      this.authConfig,
      cache.nonce,
      cache.max_age
    );

    return isValid;
  };

  private runAuthFlow = async () => {
    const config = this.authConfig;
    if (isAuthCallback(config)) {
      this.authStateService.setAuthState(AuthenticationState.Authenticating);
      const res = await this.processAuthResult();
      this.evaluateAuthState(res.id_token);
      const appState = this.getAppState();
      this.cacheService.set('authResult', res);

      if (appState.sendUserBackTo && config.preserveRoute !== false)
        replaceUrlState(appState.sendUserBackTo);
      this.authStateService.emitEvent('AuthComplete');
    } else {
      this.evaluateAuthState();
    }
  };

  private processAuthResult = async (): Promise<AuthResult> => {
    const params = getQueryParams();
    this.checkState(params);

    if (params.has('error')) throw new Error(<string>params.get('error'));

    try {
      if (this.authConfig.responseType === 'code') {
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
    const storedState = this.cacheService.get('state');
    if (storedState !== returnedState) throw new Error('Invalid state!');
  };

  private handleCodeFlowRedirect = async (
    params: URLSearchParams
  ): Promise<AuthResult> => {
    if (!params.has('code')) throw new Error('No code found in query params!');

    const code = <string>params.get('code');
    replaceUrlState(this.authConfig.redirectUri);

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

  private removeLocalSession = () => {
    const state = this.cacheService.get<string>('state');
    if (!state) return;
    this.cacheService.clear();
    this.authStateService.setAuthState(AuthenticationState.Unauthenticated);
  };

  private fetchTokensWithCode = async (code: string): Promise<AuthResult> => {
    const appState = this.getAppState();
    const body = createTokenRequestBody(
      this.authConfig,
      code,
      appState.codeVerifier
    );
    try {
      const response = await fetch(this.authConfig.tokenEndpoint!, {
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
    if (!this.authConfig) throw new Error('Missing authConfig');
    if (!this.authConfig.authorizeEndpoint)
      throw new Error(
        'Authorization endpoint is required, if not using discovery!'
      );
    if (!this.authConfig.tokenEndpoint)
      throw new Error('Token endpoint is required, if not using discovery!');
    if (!this.authConfig.jwks) throw new Error('Jwks is required!');
  };

  private tlsCheckIfEnabled = () => {
    if (this.authConfig.useHttps === false) return;

    if (!isHttps(this.authConfig.issuer))
      throw new Error('TLS check failed for issuer!');
    if (!isHttps(this.authConfig.authorizeEndpoint!))
      throw new Error('TLS check failed for authorize endpoint!');
    if (!isHttps(this.authConfig.tokenEndpoint!))
      throw new Error('TLS check failed for token endpoint!');
    if (!isHttps(this.authConfig.endsessionEndpoint!))
      throw new Error('TLS check failed for end session endpoint!');
  };
}
