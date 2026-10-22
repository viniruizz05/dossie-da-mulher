const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');
const derive = promisify(scrypt);
const dataDirectory = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
fs.mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path.join(dataDirectory, 'dossie.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, hash TEXT NOT NULL, salt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS indicators (id TEXT PRIMARY KEY, draft TEXT NOT NULL, published TEXT, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, published_at TEXT);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, action TEXT NOT NULL, indicator_id TEXT NOT NULL, snapshot TEXT NOT NULL, created_at TEXT NOT NULL);`);
const hashToken = token => createHash('sha256').update(token).digest('hex');
async function passwordHash(password, salt) {
  return Buffer.from(await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 })).toString('hex');
}
async function setAdministrator(email, password, reset = false) {
  email = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw Error('Informe um e-mail válido.');
  if (typeof password !== 'string' || password.length < 12 || password.length > 200) throw Error('A senha deve ter entre 12 e 200 caracteres.');
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (existing && !reset) throw Error('Conta já cadastrada. Use --reset para redefinir a senha.');
  const salt = randomBytes(24).toString('hex');
  const hash = await passwordHash(password, salt);
  if (existing) {
    db.prepare('UPDATE users SET hash=?,salt=? WHERE id=?').run(hash, salt, existing.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(existing.id);
  } else db.prepare('INSERT INTO users(email,hash,salt) VALUES(?,?,?)').run(email, hash, salt);
}
async function authenticate(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(String(email).trim().toLowerCase());
  const hash = await passwordHash(password, user?.salt || 'invalid-account-placeholder-salt');
  return user && timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex')) ? user : null;
}
module.exports = { db, hashToken, authenticate, setAdministrator };
