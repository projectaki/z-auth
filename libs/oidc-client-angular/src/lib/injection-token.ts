import { InjectionToken } from '@angular/core';
import { AuthConfig } from 'libs/oidc-client/src';

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
