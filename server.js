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

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
        // Shell commands logged but not auto-executed for safety
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
      // Re-use single execute logic inline
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
  console.log(`⚡ Ready to execute AI actions on the file system`);
});
