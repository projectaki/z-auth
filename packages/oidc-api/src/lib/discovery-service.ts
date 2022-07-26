import {
  AuthConfig,
  createDiscoveryUrl,
  DiscoveryDocument,
  JWKS,
  trimTrailingSlash,
} from '@z-auth/oidc-utils';
import { AuthStateService } from './auth-state-service';
import { CacheService } from './cache-service';

export class DiscoveryService {
  constructor(
    private config: AuthConfig,
    private cacheService: CacheService,
    private authStateService: AuthStateService
  ) {}

  public loadDiscoveryDocument = async (): Promise<DiscoveryDocument> => {
    try {
      const discoveryDocument =
        this.loadDiscoveryDocumentFromStorage() ??
        (await this.loadDiscoveryDocumentFromWellKnown());

      const jwks =
        this.loadJwksFromStorage() ??
        (await this.loadJwks(discoveryDocument.jwks_uri));
      discoveryDocument.jwks = jwks;

      return discoveryDocument;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  private loadDiscoveryDocumentFromWellKnown =
    async (): Promise<DiscoveryDocument> => {
      const url = createDiscoveryUrl(this.config.issuer);
      const response = await fetch(url, { method: 'GET' });
      const discoveryDocument = await response.json();
      if (!discoveryDocument)
        throw new Error('Discovery document is required!');
      if (this.config.validateDiscovery !== false)
        this.validateDiscoveryDocument(discoveryDocument);
      this.cacheService.set('discoveryDocument', discoveryDocument);
      this.authStateService.emitEvent('DiscoveryDocumentLoaded');

      return discoveryDocument;
    };

  private loadDiscoveryDocumentFromStorage = () => {
    const discoveryDocument =
      this.cacheService.get<DiscoveryDocument>('discoveryDocument');
    if (discoveryDocument && this.config.validateDiscovery !== false)
      this.validateDiscoveryDocument(discoveryDocument);

    return discoveryDocument;
  };

  private validateDiscoveryDocument(discoveryDocument: DiscoveryDocument) {
    if (!discoveryDocument) throw new Error('Discovery document is required!');

    const issuerWithoutTrailingSlash = trimTrailingSlash(
      discoveryDocument.issuer
    );
    if (issuerWithoutTrailingSlash !== this.config.issuer)
      throw new Error('Invalid issuer in discovery document');
  }

  private loadJwksFromStorage = () => {
    const jwks = this.cacheService.get<JWKS>('jwks');

    return jwks;
  };

  private loadJwks = async (uri: string) => {
    try {
      const response = await fetch(uri, { method: 'GET' });
      const jwks = await response.json();
      this.cacheService.set('jwks', jwks);
      this.authStateService.emitEvent('JwksLoaded');

      return jwks;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}