import { getCorsUrls } from './app.config';

describe('getCorsUrls', () => {
  it.each(['local', 'development'])('allows the local dev servers in %s', (environment) => {
    const urls = getCorsUrls(environment);

    expect(urls).toContain('http://localhost:3000');
    expect(urls).toContain('http://127.0.0.1:5173');
  });

  it('reads the production origins from FRONTEND_URL and ADMIN_FRONTEND_URL', () => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com, https://www.example.com');
    vi.stubEnv('ADMIN_FRONTEND_URL', 'https://admin.example.com');

    expect(getCorsUrls('production')).toEqual([
      'https://app.example.com',
      'https://www.example.com',
      'https://admin.example.com',
    ]);
  });

  it('allows no origin in production when none is configured', () => {
    vi.stubEnv('FRONTEND_URL', '');
    vi.stubEnv('ADMIN_FRONTEND_URL', '');

    expect(getCorsUrls('production')).toEqual([]);
  });
});
