/**
 * Sirou Factory — Local Execution Server
 * يعمل كخادم محلي لتنفيذ أوامر الذكاء الاصطناعي على نظام الملفات الفعلي.
 * 
 * التشغيل: node server.js
 * المنفذ: 3001
 * 
 * ⚠️ هذا الخادم مخصص للتشغيل المحلي فقط — لا تنشره على الإنترنت.
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
const port = 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CORS: فقط localhost مسموح ───
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // السماح بالطلبات بدون origin (مثل curl المحلي)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`🚫 CORS: طلب مرفوض من ${origin}`);
    return callback(new Error('غير مسموح — CORS'));
  },
  credentials: true,
}));

// ─── حد حجم الطلب: 100KB ───
app.use(express.json({ limit: '100kb' }));
app.use((err, _req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: '🚫 الطلب كبير جداً. الحد الأقصى 100KB. قسّم الطلب لأجزاء أصغر.' });
  }
  next(err);
});

// ─── عداد طلبات (Rate Limiter) ───
const requestLog = [];
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit() {
  const now = Date.now();
  // إزالة الطلبات القديمة
  while (requestLog.length > 0 && now - requestLog[0] > RATE_WINDOW_MS) {
    requestLog.shift();
  }
  if (requestLog.length >= RATE_LIMIT) {
    return false;
  }
  requestLog.push(now);
  return true;
}

// ─── Forbidden paths ───
const FORBIDDEN = ['node_modules', '.env', 'package-lock.json', 'bun.lock', '.git'];

function isForbidden(targetPath) {
  return FORBIDDEN.some(f => targetPath.includes(f));
}

function safePath(targetPath) {
  const resolved = path.resolve(__dirname, targetPath);
  if (!resolved.startsWith(__dirname)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

// ─── قائمة الأوامر المسموحة (Whitelist) ───
const ALLOWED_COMMANDS = ['npm', 'npx', 'node', 'git', 'mkdir', 'cp', 'mv'];

function isCommandAllowed(command) {
  if (!command || typeof command !== 'string') return false;
  const base = command.trim().split(/\s+/)[0];
  return ALLOWED_COMMANDS.includes(base);
}

// ─── Rate limit middleware ───
app.use('/execute', (req, res, next) => {
  if (!checkRateLimit()) {
    return res.status(429).json({ error: '⏳ تجاوزت الحد الأقصى (10 طلبات/دقيقة). انتظر قليلاً.' });
  }
  next();
});
app.use('/execute-batch', (req, res, next) => {
  if (!checkRateLimit()) {
    return res.status(429).json({ error: '⏳ تجاوزت الحد الأقصى (10 طلبات/دقيقة). انتظر قليلاً.' });
  }
  next();
});

// ─── Execute endpoint ───
app.post('/execute', (req, res) => {
  const { action, path: targetPath, content, newPath, search, replace, recursive, command, packages, dev } = req.body;

  if (!action || !targetPath) {
    return res.status(400).json({ error: 'Missing action or path' });
  }

  if (isForbidden(targetPath)) {
    return res.status(403).json({ error: `🚫 Access denied: ${targetPath}` });
  }

  try {
    const fullPath = safePath(targetPath);

    switch (action) {
      case 'create_file':
      case 'update_file':
      case 'append_file': {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        if (action === 'append_file' && fs.existsSync(fullPath)) {
          fs.appendFileSync(fullPath, content, 'utf8');
        } else {
          fs.writeFileSync(fullPath, content || '', 'utf8');
        }
        return res.json({ success: true, message: `✅ ${action}: ${targetPath}` });
      }

      case 'edit_file': {
        if (!fs.existsSync(fullPath)) {
          return res.status(404).json({ error: `File not found: ${targetPath}` });
        }
        let fileContent = fs.readFileSync(fullPath, 'utf8');
        if (!fileContent.includes(search)) {
          return res.status(400).json({ error: `Search text not found in: ${targetPath}` });
        }
        fileContent = fileContent.replace(search, replace);
        fs.writeFileSync(fullPath, fileContent, 'utf8');
        return res.json({ success: true, message: `✅ edit_file: ${targetPath}` });
      }

      case 'delete_file': {
        if (!fs.existsSync(fullPath)) {
          return res.status(404).json({ error: `File not found: ${targetPath}` });
        }
        if (recursive && fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        return res.json({ success: true, message: `✅ delete_file: ${targetPath}` });
      }

      case 'rename_file': {
        if (!newPath) {
          return res.status(400).json({ error: 'Missing newPath for rename' });
        }
        if (isForbidden(newPath)) {
          return res.status(403).json({ error: `🚫 Access denied: ${newPath}` });
        }
        const newFullPath = safePath(newPath);
        const newDir = path.dirname(newFullPath);
        if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });
        fs.renameSync(fullPath, newFullPath);
        return res.json({ success: true, message: `✅ rename: ${targetPath} → ${newPath}` });
      }

      case 'shell_cmd': {
        if (!isCommandAllowed(command || targetPath)) {
          const cmd = command || targetPath;
          console.warn(`🚫 أمر مرفوض: ${cmd}`);
          return res.status(403).json({
            error: `🚫 أمر غير مسموح: "${cmd}". الأوامر المسموحة: ${ALLOWED_COMMANDS.join(', ')}`,
          });
        }
        return res.json({
          success: true,
          message: `📋 Shell command logged (manual execution required): ${command || targetPath}`,
          requiresManual: true
        });
      }

      case 'install_dep': {
        return res.json({
          success: true,
          message: `📦 Install logged: ${(packages || []).join(', ')}${dev ? ' (dev)' : ''}`,
          requiresManual: true
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Batch execute endpoint ───
app.post('/execute-batch', (req, res) => {
  const { actions } = req.body;
  if (!Array.isArray(actions)) {
    return res.status(400).json({ error: 'actions must be an array' });
  }

  const results = [];
  for (const act of actions) {
    try {
      const targetPath = act.path;
      if (!act.action || !targetPath) {
        results.push({ success: false, error: 'Missing action or path' });
        continue;
      }
      if (isForbidden(targetPath)) {
        results.push({ success: false, error: `🚫 Access denied: ${targetPath}` });
        continue;
      }

      const fullPath = safePath(targetPath);
      const dir = path.dirname(fullPath);

      switch (act.action) {
        case 'create_file':
        case 'update_file':
        case 'append_file': {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          if (act.action === 'append_file' && fs.existsSync(fullPath)) {
            fs.appendFileSync(fullPath, act.content || '', 'utf8');
          } else {
            fs.writeFileSync(fullPath, act.content || '', 'utf8');
          }
          results.push({ success: true, message: `✅ ${act.action}: ${targetPath}` });
          break;
        }
        case 'delete_file': {
          if (fs.existsSync(fullPath)) {
            if (act.recursive && fs.statSync(fullPath).isDirectory()) {
              fs.rmSync(fullPath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(fullPath);
            }
          }
          results.push({ success: true, message: `✅ delete: ${targetPath}` });
          break;
        }
        default:
          results.push({ success: true, message: `📋 Logged: ${act.action}` });
      }
    } catch (err) {
      results.push({ success: false, error: err.message });
    }
  }

  res.json({ success: true, results });
});

// ─── Health check ───
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Sirou Factory Executor Running on http://localhost:${port}`);
  console.log(`📁 Project root: ${__dirname}`);
  console.log(`🔒 CORS: localhost فقط`);
  console.log(`⚡ Ready to execute AI actions on the file system`);
});
