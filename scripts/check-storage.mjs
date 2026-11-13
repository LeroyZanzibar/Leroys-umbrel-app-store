#!/usr/bin/env node
// Validate Umbrel path rewriting and the actual package's storage configuration.
// Run on a disposable Docker-capable runner, never against production app data.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

const service = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const rewrite = source => source.replace('/data/storage/downloads', '/home/Downloads').replace('/data/storage', '/home');
const prefix = '/home/umbrel/umbrel/app-data/leroys-sol-diagnostics';
assert.notEqual(rewrite(`${prefix}/data/storage`), `${prefix}/data/storage`, 'Regression fixture must reproduce the original collision');
assert.equal(service.volumes.length, 1);
const [source, target] = service.volumes[0].split(':');
const expanded = source.replace('${APP_DATA_DIR}', prefix);
assert.equal(rewrite(expanded), expanded, 'Umbrel would rewrite the source mount');
assert.equal(source, '${APP_DATA_DIR}/data');
assert.equal(target, '/data');
assert.equal(service.environment.SOL_DATA_DIR, '/data/storage');
assert.equal(service.user, '1000:1000');
assert.equal(service.read_only, true);
assert.equal(service.environment.SOL_PASSWORD, '${APP_PASSWORD}');
console.log('PASS: actual package mount survives Umbrel legacy rewriting and retains the original storage directory.');
if (process.argv.includes('--static-only')) process.exit(0);

const root = mkdtempSync(join(tmpdir(), 'sol-package-'));
const data = join(root, 'data');
mkdirSync(join(data, 'storage'), {recursive: true});
const name = `sol-package-${randomUUID()}`;
const password = randomUUID();
const image = service.image;
let base;
const docker = (...args) => execFileSync('docker', args, {encoding: 'utf8', timeout: 150000,
  env: {...process.env, SOL_PASSWORD: password}, maxBuffer: 4 * 1024 * 1024}).trim();
const auth = `Basic ${Buffer.from(`admin:${password}`).toString('base64')}`;
async function request(path, options = {}) {
  return fetch(base + path, {...options, signal: AbortSignal.timeout(10000),
    headers: {Authorization: auth, ...options.headers}});
}
async function start() {
  docker('run', '-d', '--name', name, '--init', '--user', service.user,
    '--read-only', '--cap-drop=ALL', '--security-opt=no-new-privileges',
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=128m',
    '--mount', `type=bind,source=${data},target=/data`, '-p', '127.0.0.1::3080',
    '-e', 'SOL_PASSWORD', '-e', 'SOL_USERNAME=admin',
    '-e', `SOL_DATA_DIR=${service.environment.SOL_DATA_DIR}`, image);
  base = `http://${docker('port', name, '3080/tcp')}`;
  for (let i = 0; i < 60; i++) {
    assert.equal(docker('inspect', '--format={{.State.Running}}', name), 'true');
    try { if ((await request('/healthz')).ok) return; } catch {}
    await delay(1000);
  }
  throw Error('Package startup timed out');
}
try {
  docker('run', '--rm', '--user', '0:0', '--network', 'none', '--read-only',
    '--cap-drop=ALL', '--cap-add=CHOWN', '--cap-add=FOWNER',
    '--mount', `type=bind,source=${data},target=/data`, '--entrypoint', 'sh', image,
    '-c', 'chown -R 1000:1000 /data && chmod 755 /data /data/storage');
  await start();
  const created = await request('/api/site-settings', {method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({name: 'Synthetic package storage test', country: 'US', latitude: '35.2', longitude: '-80.8'})});
  assert.ok(created.ok, await created.clone().text());
  const {site} = await created.json();
  assert.ok(site.id);
  docker('exec', name, 'node', '-e', "require('node:fs').accessSync('/data/storage/sol-diagnostics.sqlite')");
  docker('stop', '--time', '120', name);
  docker('rm', name);
  await start();
  const loaded = await request('/api/site-settings');
  assert.ok(loaded.ok);
  assert.ok((await loaded.json()).sites.some(item => item.id === site.id));
  console.log('PASS: package creates its database in /data/storage and retains a site after container recreation.');
} catch (error) {
  console.error(error);
  try { console.error(docker('logs', '--tail', '40', name)); } catch {}
  throw error;
} finally {
  try { docker('rm', '-f', name); } catch {}
  docker('run', '--rm', '--user', '1000:1000', '--network', 'none', '--read-only',
    '--cap-drop=ALL', '--mount', `type=bind,source=${data},target=/data`, '--entrypoint', 'node', image,
    '-e', "const fs=require('node:fs');for(const n of fs.readdirSync('/data'))fs.rmSync('/data/'+n,{recursive:true,force:true});fs.chmodSync('/data',0o755)");
  rmSync(root, {recursive: true, force: true});
}
