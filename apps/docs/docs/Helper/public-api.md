---
title: Public API
---

```ts
createParamsFromConfig: (authConfig: AuthConfig, extraParams?: QueryParams) =>
  AuthParams;
```

```ts
export declare const createAuthUrl: (
  url: string,
  authUrlParams: AuthParams,
  codeChallenge?: string
) => string;
```

```ts
export declare const createTokenRequestBody: (
  authConfig: AuthConfig,
  code: string,
  codeVerifier: string
) => string;
```

```ts
export declare const getGrantType: (authConfig: AuthConfig) => string;
```

```ts
export declare const createVerifierAndChallengePair: (
  length?: number
) => string[];
```

```ts
export declare const verifyChallenge: (
  verifier: string,
  challenge: string
) => boolean;
```

```ts
export declare const createRandomString: (length: number) => string;
```

```ts
export declare const createNonce: (length: number) => string;
```

```ts
export declare const createDiscoveryUrl: (issuer: string) => string;
```

```ts
export declare const trimTrailingSlash: (value: string) => string;
```

```ts
export declare const validateIdToken: (
  idToken: string,
  authConfig: AuthConfig,
  nonce?: string,
  max_age?: number
) => boolean;
```

```ts
export declare const createLogoutUrl: (
  endsessionEndpoint: string,
  queryParams?: QueryParams
) => string;
```

```ts
export declare const isAuthCallback: (
  authConfig: AuthConfig,
  useState?: boolean,
  responseType?: 'code'
) => boolean;
```
