import express from "express";

const app = express();
app.use(express.json());

// Simple API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Frannie Nails API working!' });
});

// Catch all route
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Frannie Nails - Coming Soon</title>
        <style>
          body { font-family: Arial; text-align: center; margin: 50px; }
          h1 { color: #ff6b9d; }
        </style>
      </head>
      <body>
        <h1>🌸 Frannie Nails 🌸</h1>
        <p>Sistema di gestione salone in arrivo!</p>
        <p>Database: ${process.env.DATABASE_URL ? 'Connesso ✅' : 'Non configurato ❌'}</p>
      </body>
    </html>
  `);
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

export default app;
