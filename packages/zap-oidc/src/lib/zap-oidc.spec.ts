import { zapOidc } from './zap-oidc';

describe('zapOidc', () => {
  it('should work', () => {
    expect(zapOidc()).toEqual('zap-oidc');
  });
});
