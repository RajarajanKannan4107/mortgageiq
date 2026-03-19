# MortgageIQ — Smart Home Finance Calculator

A responsive, real-time mortgage calculator built with **React** and plain **CSS**.

## Features
- Live payment breakdown (principal, tax, insurance, PMI, HOA)
- Animated donut chart
- Amortization schedule (360 months)
- Debt-to-income ratio indicator
- 3 loan types: 30-yr Fixed, 15-yr Fixed, 5/1 ARM
- Fully responsive (mobile + desktop)

## Getting Started

```bash
npm install
npm start
```

## Deploy to GitHub Pages

1. Update `homepage` in `package.json` with your GitHub username:
   ```json
   "homepage": "https://YOUR_USERNAME.github.io/mortgage-iq"
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

## Project Structure

```
mortgage-iq/
├── public/
│   └── index.html
├── src/
│   ├── App.js        ← React components & logic
│   ├── styles.css    ← All styling
│   └── index.js      ← Entry point
├── assets/           ← Static assets (images, icons)
├── .gitignore
├── package.json
└── README.md
```
