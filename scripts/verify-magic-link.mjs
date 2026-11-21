import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parsePokeTrackMagicLink} from '../app/src/main/assets/www/magic-link.js';
const origin='https://bsukdkdwubebopupmoan.supabase.co';
const token='a'.repeat(64);
const valid=origin+'/auth/v1/verify?token='+token+'&type=magiclink&redirect_to=http%3A%2F%2Flocalhost%3A3000';
assert.deepEqual(parsePokeTrackMagicLink(valid,origin),{type:'magiclink',token_hash:token});
assert.deepEqual(parsePokeTrackMagicLink(valid.replace('type=magiclink','type=signup'),origin),{type:'signup',token_hash:token});
assert.deepEqual(parsePokeTrackMagicLink(valid.replace('type=magiclink','type=email'),origin),{type:'email',token_hash:token});
const invalid=[
 '',
 'not-a-url',
 'https://evil.example/auth/v1/verify?token='+token+'&type=magiclink',
 origin+'.evil.example/auth/v1/verify?token='+token+'&type=magiclink',
 'http://bsukdkdwubebopupmoan.supabase.co/auth/v1/verify?token='+token+'&type=magiclink',
 origin+'/auth/v1/logout?token='+token+'&type=magiclink',
 valid.replace(token,'short'),
 valid.replace('type=magiclink','type=recovery'),
 valid+'#access_token=fake',
 valid.replace('https://','https://user:password@')
];
for(const value of invalid)assert.throws(()=>parsePokeTrackMagicLink(value,origin),Error);
const root=new URL('../app/src/main/assets/www/',import.meta.url);
const app=await readFile(new URL('app.js',root),'utf8');
const sync=await readFile(new URL('sync.js',root),'utf8');
const css=await readFile(new URL('home-game.css',root),'utf8');
assert.ok(app.includes('magic-link-form')&&app.includes('verifyMagicLink(link)'));
assert.ok(app.includes('Copy link address')&&app.includes('Do not open it first'));
assert.ok(app.includes('type="password" id="magic-link-field"'),'Never show sign-in token unmasked by default');
assert.ok(!app.includes('For sign-in codes, the project'), 'Old SMTP-dependent instructions remain');
assert.ok(sync.includes("request('/auth/v1/verify','POST',payload)"));
assert.ok(sync.includes('parsePokeTrackMagicLink(link,url)'));
assert.ok(css.includes('#magic-link-form'));
console.log('✅ Magic Link login: eligible Supabase URL parsed, wrong origins rejected, signup/magiclink accepted, password-masked paste field.');
