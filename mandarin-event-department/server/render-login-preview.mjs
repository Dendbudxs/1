import { writeFileSync,copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { accessPage,privacyPage } from './pages.mjs';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
// Safe static preview: no session simulation and no working sign-in button.
writeFileSync(dist+'login.html',accessPage('sign_in_required',null,false,{preview:true}));
writeFileSync(dist+'privacy.html',privacyPage({preview:true}));
copyFileSync(new URL('./auth.css',import.meta.url),dist+'auth.css');
console.log('Login preview rendered: dist/login.html');
