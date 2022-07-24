import { InjectionToken } from '@angular/core';
import { AuthConfig } from '@z-auth/oidc-api';

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
