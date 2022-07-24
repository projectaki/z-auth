import {
  AuthConfig,
  createDiscoveryUrl,
  DiscoveryDocument,
  JWKS,
  StateParams,
  trimTrailingSlash,
} from '@z-auth/oidc-utils';
import { getLocalSession } from './cache/cache-service';
import { Event } from './events';
import { BrowserStorageService } from './storage/browser-storage-service';
import { StorageService } from './storage/storage-service';

export class DiscoveryService {
  constructor(
    private storageService: StorageService = new BrowserStorageService()
  ) {}

  public getDiscoveryDocument(): DiscoveryDocument {
    const doc = this.storageService.get<DiscoveryDocument>('discoveryDocument');
    if (!doc) throw new Error('Discovery document is required!');

    return doc;
  }

  public loadDiscoveryDocument = async (
    config: AuthConfig,
    emitEvent: (event: Event) => void
  ): Promise<[DiscoveryDocument, JWKS]> => {
    try {
      let discoveryDocument =
        this.storageService.get<DiscoveryDocument>('discoveryDocument');
      if (!discoveryDocument) {
        discoveryDocument = await this.loadDiscoveryDocumentFromWellKnown(
          config
        );

        this.storageService.set('discoveryDocument', discoveryDocument);
        emitEvent('DiscoveryDocumentLoaded');
      } else {
        console.log('discovery doc cached');
      }

      if (config.validateDiscovery == null || !!config.validateDiscovery)
        this.validateDiscoveryDocument(config, discoveryDocument!);

      let jwks = this.storageService.get<JWKS>('jwks');
      if (!jwks) {
        jwks = await this.loadJwks();

        this.storageService.set('jwks', jwks);
        emitEvent('JwksLoaded');
      } else {
        console.log('Jwsk cached');
      }

      return [discoveryDocument!, jwks!];
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  private loadDiscoveryDocumentFromWellKnown = async (config: AuthConfig) => {
    const url = createDiscoveryUrl(config.issuer);
    const response = await fetch(url, { method: 'GET' });
    const discoveryDocument = await response.json();

    return discoveryDocument;
  };

  private validateDiscoveryDocument(
    config: AuthConfig,
    discoveryDocument: DiscoveryDocument
  ) {
    if (!discoveryDocument) throw new Error('Discovery document is required!');

    const issuerWithoutTrailingSlash = trimTrailingSlash(
      discoveryDocument.issuer
    );
    if (issuerWithoutTrailingSlash !== config.issuer)
      throw new Error('Invalid issuer in discovery document');
  }

  private loadJwks = async () => {
    const url = `${this.getDiscoveryDocument().jwks_uri}`;
    try {
      const response = await fetch(url, { method: 'GET' });
      const jwks = await response.json();

      return jwks;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };
}
