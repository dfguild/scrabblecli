import { domain, clientId, audience } from '../../auth_config.json';

export const environment = {
  production: true,
  apiUrl: 'https://guild-scrabble-api.azurewebsites.net/',
  auth: {
    domain,
    clientId,
    audience,
    redirectUri: window.location.origin,
  },
};
