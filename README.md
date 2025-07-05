# Mercados La Convención - Inventory App

This is a cute, rounded, and friendly inventory management app for Mercados La Convención, powered by [JSON Server](https://github.com/typicode/json-server).

## Features
- Add, edit, delete, and search products in a friendly UI
- Data is stored in `db.json` and served via JSON Server
- Animations and rounded, soft design
- All code is commented in English for easy understanding

## Getting Started

1. **Install dependencies**

   Open a terminal in this folder and run:
   ```sh
   npm install
   ```

2. **Start the JSON Server**

   You can use the batch file:
   ```sh
   start-server.bat
   ```
   Or run manually:
   ```sh
   npx json-server --watch db.json --port 3001
   ```

3. **Open `index.html` in your browser**

   The app will connect to the local server at `http://localhost:3001/products`.


