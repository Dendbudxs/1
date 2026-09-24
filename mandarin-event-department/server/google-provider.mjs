import { OAuth2Client } from 'google-auth-library';

// Use Google's maintained verifier, never a decoded but unverified JWT.
export function createGoogleProvider(config,{client}={}) {
  const google=client||new OAuth2Client({
    clientId:config.clientId,clientSecret:config.clientSecret,
    redirectUri:config.origin+'/auth/google/callback',
    transporterOptions:{timeout:10000,retry:false}
  });
  return {
    async exchange(code,codeVerifier) {
      const {tokens}=await google.getToken({code,codeVerifier,redirect_uri:config.origin+'/auth/google/callback'});
      if(!tokens.id_token)throw Error('No Google identity token.');
      const ticket=await google.verifyIdToken({idToken:tokens.id_token,audience:config.clientId});
      // Access/refresh/ID tokens are intentionally not persisted or sent to the browser.
      return ticket.getPayload();
    }
  };
}
