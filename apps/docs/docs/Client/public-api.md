---
title: Public API
---

---

## registerEvents

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
