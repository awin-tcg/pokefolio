# SHNY CRBD

A trading-card portfolio tracker with a market-terminal feel. Track what you own, what it cost, and what it is worth now. Formerly called PokéFolio.

**Live demo:** https://pokefolio-gilt.vercel.app

## What it does

- **Dashboard** — portfolio value over time, realized and unrealized profit and loss, top gainers and losers
- **Binder** — holdings organized into collections, with a wantlist and sealed products
- **Market signals** — RSI, momentum, volatility, and liquidity calculated per card
- **Tools** — trade calculator with multiple cards per side, and a grading return-on-investment estimator
- **Alerts** — price targets on owned and wantlist cards
- **News** — market pulse and release calendar
- **Scan** — add cards by search or image (experimental)

## Data

This is a prototype. The card catalog in `src/data.js` is a hand-built sample set, and price history is generated in the browser rather than pulled from a live market feed. Your portfolio is saved to `localStorage`, so it stays on your device.

Purchases are stored as lots (price, quantity, date) per card. Cost basis, blended cost, and profit and loss are all derived from those lots in `src/utils.js`.

## Tech stack

- React and Vite
- Tailwind CSS
- Recharts for charts
- Fuse.js for fuzzy card search
- lucide-react for icons

## Run it locally

```bash
npm install
npm run dev
```

Then open the local address Vite prints. `npm run build` creates a production build in `dist/`.

## Project layout

```
src/
  App.jsx          app state, persistence, and view routing
  data.js          card catalog, sealed products, and market sample data
  utils.js         cost basis, profit and loss, RSI, and trade math
  components/
    dashboard.jsx  portfolio charts and stats
    binder.jsx     collections, wantlist, sealed products
    scan.jsx       search and scan to add cards
    news.jsx       market pulse and release calendar
    tools.jsx      trade calculator and grading tools
    modals.jsx     card detail and entry forms
    profile.jsx    settings
    ui.jsx         shared interface pieces
```

## Roadmap

- Live market pricing
- One Piece and Riftbound card support
- Vendor mode with a show-day sales ledger

## Author

Allen Nguyen ([@awin-tcg](https://github.com/awin-tcg))
