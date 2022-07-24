import { StateParams } from '@z-auth/oidc-utils';
import { StorageService } from '../storage/storage-service';

export const getLocalSession = (
  storageService: StorageService
): {
  state: string;
  stateParams: StateParams;
} | null => {
  const state = storageService.get<string>('state');
  if (!state) return null;
  const stateParams = storageService.get<StateParams>(state);
  if (!stateParams) return null;

  return { state, stateParams };
};
