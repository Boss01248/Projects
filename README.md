# Finance Health

A modern finance tracking app with a sleek UI and SQLite database backend.

## Features

- Real-time financial dashboard with income, expenses, and net savings
- Spending categories with visual progress rings
- Recent transaction history
- Live database synchronization
- RESTful API for transaction management

## Setup

### Prerequisites

- Node.js 26.0.0 or higher
- npm 11.12.1 or higher

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd /Users/krishnasharma/Desktop/Projects
   ```

2. Install dependencies:
   ```bash
   export PATH="/opt/homebrew/bin:$PATH"
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`

## Usage

- Open `http://localhost:3000` in your browser
- View your financial summary with live database data
- Check recent transactions from the database
- Add new transactions via the API

## API Endpoints

### Get Summary
```
GET /api/summary
```
Returns total income, total expense, transaction count, and recent transactions.

### Get All Transactions
```
GET /api/transactions
```
Returns all transactions from the database.

### Add Transaction
```
POST /api/transactions
Content-Type: application/json

{
  "category": "Food & Dining",
  "amount": 32.50,
  "type": "expense",
  "date": "2026-05-25",
  "notes": "Pizza Hut"
}
```

## Database

The app uses SQLite with a `transactions` table. The database file is automatically created on first run at `data.db`.

## Shell Configuration Note

If the server doesn't start, ensure the Homebrew PATH is set:
```bash
export PATH="/opt/homebrew/bin:$PATH"
npm start
```

Or add this to your shell profile (`~/.zshrc`):
```bash
export PATH="/opt/homebrew/bin:$PATH"
```
