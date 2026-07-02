const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

// Servir les fichiers statiques (HTML, CSS, JS, images...)
app.use(express.static(ROOT));

// Toute URL sans extension qui ne correspond pas à un fichier existant
// → c'est un ancien URL de l'ancien site WordPress → rediriger vers le catalogue
app.get('*', (req, res) => {
  const hasExtension = path.extname(req.path) !== '';
  if (!hasExtension) {
    return res.redirect(301, '/catalogue.html');
  }
  res.status(404).sendFile(path.join(ROOT, '404.html'));
});

app.listen(PORT, () => console.log(`Site en ligne sur le port ${PORT}`));
