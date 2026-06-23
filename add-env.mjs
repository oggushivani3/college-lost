import { spawnSync } from 'child_process';

const envVars = [
  { key: 'VITE_API_URL', value: 'https://college-lost.onrender.com/api' },
];

for (const { key, value } of envVars) {
  console.log(`Adding ${key}...`);
  for (const env of ['production', 'preview', 'development']) {
    const p = spawnSync('npx.cmd', ['vercel', 'env', 'add', key, env], {
      input: value + '\n',
      encoding: 'utf-8',
      cwd: process.cwd()
    });
    const out = (p.stdout || '') + (p.stderr || '');
    console.log(`  ${env}: ${out.trim().split('\n').slice(-2).join(' ')}`);
  }
}
console.log('Done!');
