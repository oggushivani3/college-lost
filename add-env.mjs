import { spawnSync } from 'child_process';

const envVars = [
  { key: 'VITE_FIREBASE_API_KEY', value: 'AIzaSyCfxZwb1c4_aeWEy54JP1O5HsYPeavJkxY' },
  { key: 'VITE_FIREBASE_AUTH_DOMAIN', value: 'vits-lostfound.firebaseapp.com' },
  { key: 'VITE_FIREBASE_PROJECT_ID', value: 'vits-lostfound' },
  { key: 'VITE_FIREBASE_STORAGE_BUCKET', value: 'vits-lostfound.firebasestorage.app' },
  { key: 'VITE_FIREBASE_MESSAGING_SENDER_ID', value: '439324966372' },
  { key: 'VITE_FIREBASE_APP_ID', value: '1:439324966372:web:88a6edbe507681d387dbf1' },
];

for (const { key, value } of envVars) {
  console.log(`Adding ${key}...`);

  // Add for each environment separately: production, preview, development
  for (const env of ['production', 'preview', 'development']) {
    const p = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, env], {
      input: value + '\n',
      encoding: 'utf-8',
      cwd: process.cwd()
    });
    const out = (p.stdout || '') + (p.stderr || '');
    if (out.includes('Added') || out.includes('already') || out.includes('exists')) {
      console.log(`  ✓ ${env}: ${out.trim().split('\n').pop()}`);
    } else if (out.includes('error')) {
      console.log(`  ✗ ${env}: ${out.trim().split('\n').slice(-3).join(' ')}`);
    } else {
      console.log(`  ~ ${env}: ${out.trim().split('\n').slice(-2).join(' ')}`);
    }
  }
}

console.log('\nAll done! Now redeploying...');
const deploy = spawnSync('npx.cmd', ['vercel', '--prod', '--yes'], {
  encoding: 'utf-8',
  cwd: process.cwd()
});
console.log(deploy.stdout || '');
if (deploy.stderr) console.error(deploy.stderr);
