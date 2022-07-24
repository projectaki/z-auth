import { KEYUTIL, KJUR } from 'jsrsasign';
import { dateNowMsSinceEpoch } from './datetime-helper';
import { base64UrlEncode, base64UrlDecode } from './encode-helper';
import { sha256 } from './hash-helper';
import { decodeJWt } from './jwt-helper';
import { AuthConfig, QueryParams, AuthParams, JWK } from './models';
import { getQueryParams, getUrlWithoutParams } from './url-helper';

const SKEW_DEFAULT = 0;

export const createParamsFromConfig = (
  authConfig: AuthConfig,
  extraParams?: QueryParams
) => {
  const authUrlParams: AuthParams = {
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    response_type: authConfig.responseType,
    scope: authConfig.scope,
  };

  const queryParams = authConfig.queryParams;
  if (queryParams) {
    Object.keys(queryParams).forEach((key) => {
      authUrlParams[key] = queryParams[key];
    });
  }

  if (extraParams) {
    Object.keys(extraParams).forEach((key) => {
      authUrlParams[key] = extraParams[key];
    });
  }

  return authUrlParams;
};

export const createAuthUrl = (
  url: string,
  authUrlParams: AuthParams,
  codeChallenge?: string
) => {
  const keys = Object.keys(authUrlParams);
  const queryParams = new URLSearchParams();
  keys.forEach((key) => {
    queryParams.append(key, authUrlParams[key].toString());
  });
  if (codeChallenge) queryParams.append('code_challenge', codeChallenge);
  if (codeChallenge) queryParams.append('code_challenge_method', 'S256');

  const res = `${url}?${queryParams.toString()}`;

  return res;
};

export const createTokenRequestBody = (
  authConfig: AuthConfig,
  code: string,
  codeVerifier: string
) => {
  const grantType = getGrantType(authConfig);
  const urlSearchParam = new URLSearchParams();
  urlSearchParam.append('grant_type', grantType);
  urlSearchParam.append('code', code);
  urlSearchParam.append('code_verifier', codeVerifier);
  urlSearchParam.append('redirect_uri', authConfig.redirectUri);
  urlSearchParam.append('client_id', authConfig.clientId);
  const body = urlSearchParam.toString();

  return body;
};

export const getGrantType = (authConfig: AuthConfig) => {
  const { responseType } = authConfig;
  if (responseType === 'code') {
    return 'authorization_code';
  }

  return 'implicit';
};

export const createVerifierAndChallengePair = (length?: number) => {
  const verifier = createNonce(length ?? 32);
  const challenge = base64UrlEncode(sha256(verifier, 'ascii'));
  return [verifier, challenge];
};

export const verifyChallenge = (verifier: string, challenge: string) => {
  const challengeHash = base64UrlDecode(challenge);
  const verifierHash = sha256(verifier, 'ascii');

  return challengeHash === verifierHash;
};

export const createRandomString = (length: number) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const randomASCIIString = String.fromCharCode(...bytes);

  return randomASCIIString;
};

export const createNonce = (length: number) => {
  const randomASCIIString = createRandomString(length);
  const nonce = base64UrlEncode(randomASCIIString);

  return nonce;
};

export const createDiscoveryUrl = (issuer: string) => {
  const route = '/.well-known/openid-configuration';
  const issuerWithoutTrailingSlash = trimTrailingSlash(issuer);

  return `${issuerWithoutTrailingSlash}${route}`;
};

export const trimTrailingSlash = (value: string) => {
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const validateIdToken = (
  idToken: string,
  authConfig: AuthConfig,
  nonce?: string,
  max_age?: number
): boolean => {
  const { header, payload } = decodeJWt(idToken);

  checkEncryption();
  validateIssuer();
  validateAudience();
  validateSignature();
  validateAlg();
  validateMacAlg();
  validateExpClaim();
  validateIatClaim();
  validateNonce(nonce);
  validateAcrClaim();
  validateAuthTimeClaim();

  return true;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function checkEncryption() {}

  function validateIssuer() {
    const registeredIssuerWithoutTrailingSlash = trimTrailingSlash(
      authConfig.issuer
    );
    const tokenIssuerWithoutTrailingSlash = trimTrailingSlash(payload.iss);

    if (
      registeredIssuerWithoutTrailingSlash !== tokenIssuerWithoutTrailingSlash
    ) {
      throw new Error(
        `Invalid issuer, expected ${authConfig.issuer} but got ${payload.iss}`
      );
    }
  }

  function validateAudience() {
    const audiences = payload.aud.split(' ');
    if (!audiences.includes(authConfig.clientId)) {
      throw new Error(
        `Invalid audience expected ${authConfig.clientId} but got ${audiences}`
      );
    }
    if (audiences.length > 1) {
      if (!payload.azp) {
        throw new Error('azp claim is required');
      }
      if (payload.azp !== authConfig.clientId) {
        throw new Error('Invalid azp claim');
      }
    }
  }

  function validateSignature() {
    const { kid, alg } = header;

    if (kid) {
      const jwk = authConfig.jwks?.keys.find((jwk: JWK) => jwk.kid === kid);
      if (!jwk) throw new Error('Invalid kid');
      const pubKey = KEYUTIL.getKey(jwk) as jsrsasign.RSAKey;

      const isValid = KJUR.jws.JWS.verify(idToken, pubKey, [alg]);
      if (!isValid) {
        throw new Error('Invalid signature');
      }
    } else {
      const jwk = authConfig.jwks?.keys.find((jwk: JWK) => jwk.alg === alg);
      if (!jwk)
        throw new Error(
          'There was no kid, and could not find jwk with matching alg'
        );
      const pubKey = KEYUTIL.getKey(jwk) as jsrsasign.RSAKey;

      const isValid = KJUR.jws.JWS.verify(idToken, pubKey, [alg]);
      if (!isValid) {
        throw new Error('Invalid signature');
      }
    }
  }

  function validateAlg() {
    const { alg } = header;
    if (alg !== 'RS256') {
      throw new Error('Invalid algorithm, only RS256 is supported');
    }
  }

  function validateMacAlg() {
    const { alg } = header;
    if (alg === 'HS256' || alg === 'HS384' || alg === 'HS512') {
      throw new Error('Currently MAC algorithms are not supported');
    }
  }

  function validateExpClaim() {
    const skew = authConfig.clockSkewSeconds ?? SKEW_DEFAULT;
    const { exp } = payload;
    if (exp < dateNowMsSinceEpoch() + skew) {
      throw new Error('Token has expired');
    }
  }

  function validateIatClaim() {
    const skew = authConfig.clockSkewSeconds ?? SKEW_DEFAULT;
    const { iat } = payload;
    if (iat > dateNowMsSinceEpoch() + skew) {
      throw new Error('Token is not yet valid');
    }
  }

  function validateNonce(sentNonce?: string) {
    if (!sentNonce) return;
    const { nonce } = payload;
    if (!nonce) {
      throw new Error('Nonce is required');
    }

    if (!verifyChallenge(sentNonce, nonce)) {
      throw new Error('Invalid nonce');
    }
  }

  function validateAcrClaim() {
    const { acr } = payload;
    if (!acr) return;
  }

  function validateAuthTimeClaim() {
    const { auth_time } = payload;
    if (!max_age && !auth_time) return;
    if (max_age && !auth_time)
      throw new Error('auth_time required when max age was requested');
    if (!max_age && auth_time)
      throw new Error('max_age required when auth_time was returned');

    const timeToExpire = auth_time + max_age;
    if (timeToExpire < dateNowMsSinceEpoch()) {
      throw new Error('Max age was reached');
    }
  }
};

export const createLogoutUrl = (
  endsessionEndpoint: string,
  queryParams?: QueryParams
) => {
  if (!queryParams) return endsessionEndpoint;

  const searchParams = new URLSearchParams();
  Object.keys(queryParams).forEach((key) => {
    searchParams.set(key, queryParams[key].toString());
  });

  return `${endsessionEndpoint}?${searchParams.toString()}`;
};

export const isAuthCallback = (
  authConfig: AuthConfig,
  useState = true,
  responseType: 'code' = 'code'
) => {
  const params = getQueryParams();
  const currentUrl = getUrlWithoutParams();
  if (currentUrl !== authConfig.redirectUri) return false;
  if (responseType === 'code') {
    if (!params.has('code')) return false;
  }
  if (useState) {
    if (!params.has('state')) return false;
  }

  return true;
};
