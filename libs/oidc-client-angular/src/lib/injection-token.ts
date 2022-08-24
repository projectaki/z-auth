import { InjectionToken } from '@angular/core';
import { AuthConfig } from 'packages/oidc-client/src';

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
