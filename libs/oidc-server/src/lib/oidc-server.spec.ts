import { oidcServer } from './oidc-server';

describe('oidcServer', () => {
  it('should work', () => {
    expect(oidcServer()).toEqual('oidc-server');
  });
});
