const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

// Forcer UTF-8 sur tous les fichiers HTML
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/' || !path.extname(req.path)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  }
  next();
});

// Servir les fichiers statiques
app.use(express.static(ROOT, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// Anciens URLs sans extension → redirection 301 vers le catalogue
app.get('*', (req, res) => {
  const hasExtension = path.extname(req.path) !== '';
  if (!hasExtension) {
    return res.redirect(301, '/catalogue.html');
  }
  res.status(404).sendFile(path.join(ROOT, '404.html'));
});

app.listen(PORT, () => console.log(`Site en ligne sur le port ${PORT}`));
