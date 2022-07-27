---
title: Public API
---

---

## Register events

```ts
registerEvents(authStateEvent?: (authState: AuthenticationState) => void, event?: (event: Event) => void): void;
```

Register event takes two optional callback functions.

### AuthState callback

```ts
(authState: AuthenticationState) => void
```

The auth state callback gets called whenever the authentication state changes.

### Events callback

```ts
(event: Event) => void
```

The events callback gets called whenever an authentication event happens. See a list of events in the models section.

---

## Login

```ts
login: (extraParams?: QueryParams) => Promise<void>;
```

The method to start the login flow. Optional query params can be included, which will be appended to the authorization request.

---

## Local logout

```ts
localLogout: () => void;
```

The method to clear the local storage of authentication data. Use this if you do not want to end the user session on the IDP server, but only on the browser locally.

---

## Logout

```ts
logout: (queryParams?: QueryParams) => void;
```

The method to clear the local storage of authentication data, and if a logout url is configured (either through discovery or manually), then also ends the user session on the IDP server.

---

## Get Access token

```ts
getAccessToken: () => string | undefined;
```

The method to retrieve the access token if available. This is treated as an opaque string, therefore it is not validated, and shouldn't be used by the client for any sort of authentication or authorization.

---

## Get Id token

```ts
getIdToken: () => string | null;
```

The method to retrieve the id token if available. If an id token is returned, it has already been validated by the lib.

---

## Initialize the authentication

```ts
initAuth: (authConfig: AuthConfig) => Promise<void>;
```

The method to call to configure the auth library. As a param it takes an auth config param (See models for details). `initAuth` will take care of proccessing the authentication response, and also handle redirects unless configured otherwise. This method returns a Promise. Ideally it makes sense to wait for application initialization until this Promise has completed. `initAuth` will set the authentication state when it completes, so in cases where we don't wait for Promise completion, we need to include an extra check ourselves, by listening to the `authComplete` event, when checking for authenticated state.
