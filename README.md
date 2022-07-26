# z-auth

## Monorepo for typescript oidc tools

### Initially the motivation was to build an oidc client lib, which has been implemented for most of the specification, and works for SPAs. However it is still missing some of the spec which I won't be prioratizing.

### I will more focus on the oidc helper lib, as this will provide more flexibility, and can be used to complement already exisiting oidc lib solutions, which may be missing certain features.

### Initial motivation
Z-auth currently is an OIDC auth lib written in typescript. The motivation behind this lib is to create a simple but extendible typescript api for implementing the OpenID Connect protocol. The extendibility will allow to very easily write wrapper libs for specific frameworks.
>Angular example: One example would be to create a very thin wrapper around the base service for angular. This wrapper will expose an injection token, decorate the
service with @Injectable so that angular can utilize its service injection, and also create Observable streams that hook into the base service. This way, to write framework specific implementations of this lib, very little code will be required. (Angular wrapper included in lib).

Current status:
All libs are currently a WIP.

Roadmap:
* OpenID Connect helper lib: collection of util methods to help implement oidc spec.  
* OpenID Connect typescript base auth service: typescript implementation of odic spec, with simple but extendible api.  
* Framework specific wrappers.
