// Parse the UNOPENED default Supabase email link for an in-app authentication exchange.
// Security: accept links only from this app's exact Supabase project, never follow redirects.
// The one-time token must stay on this device: do not log or send it to other websites.
const AUTH_TYPES=new Set(['magiclink','signup','email']);

export function parsePokeTrackMagicLink(raw,projectUrl){
  if(typeof raw!=='string'||raw.length>4096)throw new Error('Paste the sign-in link from your email.');
  let link,project;
  try{link=new URL(raw.trim());project=new URL(projectUrl);}
  catch{throw new Error('Paste the full link address from the Supabase email, not just the button text.');}
  if(link.protocol!=='https:'||link.origin!==project.origin||link.pathname!=='/auth/v1/verify'||link.username||link.password||link.hash){
    throw new Error('That link is not from the Poké Track sign-in email.');
  }
  const type=link.searchParams.get('type');
  const tokenHash=link.searchParams.get('token');
  if(!AUTH_TYPES.has(type)||!tokenHash||!/^[a-zA-Z0-9_-]{20,512}$/.test(tokenHash)){
    throw new Error('The email link is missing a valid one-time sign-in token. Request a fresh link.');
  }
  return {type,token_hash:tokenHash};
}
