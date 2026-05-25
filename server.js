const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

app.use(express.json());
app.use(express.static(__dirname));

function initializeDatabase() {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT
      )`
    );

    db.get('SELECT COUNT(*) AS count FROM transactions', (err, row) => {
      if (err) {
        console.error('Database count error:', err.message);
        return;
      }

      if (row.count === 0) {
        const sampleData = [
          { category: 'Freelance', amount: 450.0, type: 'income', date: '2026-05-25', notes: 'Design work' },
          { category: 'Food & Dining', amount: 32.5, type: 'expense', date: '2026-05-25', notes: 'Pizza Hut' },
          { category: 'Transport', amount: 24.8, type: 'expense', date: '2026-05-24', notes: 'Uber ride' },
          { category: 'Shopping', amount: 89.99, type: 'expense', date: '2026-05-24', notes: 'Amazon purchase' },
          { category: 'Investment', amount: 127.5, type: 'income', date: '2026-05-23', notes: 'Stock dividend' }
        ];

        const stmt = db.prepare(
          'INSERT INTO transactions (category, amount, type, date, notes) VALUES (?, ?, ?, ?, ?)'
        );

        sampleData.forEach((tx) => {
          stmt.run(tx.category, tx.amount, tx.type, tx.date, tx.notes);
        });

        stmt.finalize();
      }
    });
  });
}

app.get('/api/transactions', (req, res) => {
  db.all('SELECT id, category, amount, type, date, notes FROM transactions ORDER BY date DESC, id DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/summary', (req, res) => {
  db.serialize(() => {
    db.get('SELECT SUM(amount) AS totalIncome FROM transactions WHERE type = ?', ['income'], (err, incomeRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.get('SELECT SUM(amount) AS totalExpense FROM transactions WHERE type = ?', ['expense'], (err2, expenseRow) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }

        db.get('SELECT COUNT(*) AS transactionCount FROM transactions', (err3, countRow) => {
          if (err3) {
            return res.status(500).json({ error: err3.message });
          }

          db.all(
            'SELECT category, amount, type, date FROM transactions ORDER BY date DESC, id DESC LIMIT 5',
            (err4, rows) => {
              if (err4) {
                return res.status(500).json({ error: err4.message });
              }

              res.json({
                totalIncome: incomeRow.totalIncome || 0,
                totalExpense: expenseRow.totalExpense || 0,
                transactionCount: countRow.transactionCount || 0,
                recentTransactions: rows
              });
            }
          );
        });
      });
    });
  });
});

app.post('/api/transactions', (req, res) => {
  const { category, amount, type, date, notes } = req.body;
  if (!category || !amount || !type || !date) {
    return res.status(400).json({ error: 'category, amount, type, and date are required' });
  }

  db.run(
    'INSERT INTO transactions (category, amount, type, date, notes) VALUES (?, ?, ?, ?, ?)',
    [category, amount, type, date, notes || ''],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { category, amount, type, date, notes } = req.body;
  if (!category || !amount || !type || !date) {
    return res.status(400).json({ error: 'category, amount, type, and date are required' });
  }

  db.run(
    'UPDATE transactions SET category = ?, amount = ?, type = ?, date = ?, notes = ? WHERE id = ?',
    [category, amount, type, date, notes || '', id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ message: 'Transaction updated successfully' });
    }
  );
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM transactions WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
});

app.post('/api/reset', (req, res) => {
  db.run('DELETE FROM transactions', function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'All transactions cleared successfully' });
  });
});

function startServer(port, maxRetries = 5) {
  const server = app.listen(port, () => {
    initializeDatabase();
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && maxRetries > 0) {
      console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1, maxRetries - 1);
    } else if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please free the port or start the app with a different port, e.g. PORT=${port + 1} npm start`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(PORT);
