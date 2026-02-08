// Google OAuth 2.0 sign-in helper
export function oauthSignIn({ clientId, redirectUri, scopes = [], state = '' }: {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
}) {
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

  const form = document.createElement('form');
  form.setAttribute('method', 'GET');
  form.setAttribute('action', oauth2Endpoint);

  const params: Record<string, string> = {
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: scopes.join(' '),
    include_granted_scopes: 'true',
    state,
  };

  for (const p in params) {
    const input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
