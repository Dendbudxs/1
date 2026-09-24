import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync,sign } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { createGoogleProvider } from './google-provider.mjs';

// Exercise the real Google verifier with locally signed tokens and fake Google
// HTTP responses. No credentials or requests leave the test process.
test('official verifier checks signatures, issuer, audience and expiry before returning identity',async()=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const config={origin:'https://docs.example.test',clientId:'fixture.apps.googleusercontent.com',clientSecret:'fixture-not-a-real-secret'};
  const now=Math.floor(Date.now()/1000),base={sub:'111111111111111111111',email:'fixture@gmail.com',email_verified:true,iss:'https://accounts.google.com',aud:config.clientId,iat:now,exp:now+3600,nonce:'fixture-nonce'};
  let current=base,broken=false,requests=0;
  function token(){
    const header=Buffer.from(JSON.stringify({alg:'RS256',kid:'fixture-key'})).toString('base64url');
    const payload=Buffer.from(JSON.stringify(current)).toString('base64url'),input=header+'.'+payload;
    const signature=sign('RSA-SHA256',Buffer.from(input),privateKey).toString('base64url');
    return input+'.'+(broken?(signature[0]==='A'?'B':'A')+signature.slice(1):signature);
  }
  const client=new OAuth2Client({clientId:config.clientId,clientSecret:config.clientSecret,redirectUri:config.origin+'/auth/google/callback'});
  client.transporter.request=async options=>{
    requests++;
    if(String(options.url)==='https://oauth2.googleapis.com/token'){
      const values=new URLSearchParams(options.data);assert.equal(values.get('code_verifier'),'fixture-verifier');assert.equal(values.get('redirect_uri'),config.origin+'/auth/google/callback');
      return {data:{id_token:token()},headers:new Headers()};
    }
    assert.equal(String(options.url),'https://www.googleapis.com/oauth2/v1/certs');
    return {data:{'fixture-key':publicKey.export({type:'spki',format:'pem'})},headers:new Headers({'cache-control':'max-age=3600'})};
  };
  const provider=createGoogleProvider(config,{client});
  const identity=await provider.exchange('fixture-code','fixture-verifier');assert.equal(identity.sub,base.sub);assert.equal(identity.email,base.email);assert.equal(requests,2);
  broken=true;await assert.rejects(provider.exchange('fixture-code','fixture-verifier'));broken=false;
  for(const changes of [{aud:'another-client'},{iss:'https://attacker.invalid'},{iat:now-7200,exp:now-3600}]){
    current={...base,...changes};await assert.rejects(provider.exchange('fixture-code','fixture-verifier'));
  }
});
