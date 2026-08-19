# ❄️ Snowflake Sales Analytics Dashboard

A full-stack analytics dashboard built with **React, Netlify Functions, and Snowflake**.

The application queries Snowflake's `SNOWFLAKE_SAMPLE_DATA` dataset and displays real sales analytics through an interactive React dashboard.

## 🚀 Live Demo

Coming soon — deployed with Netlify.

## 📊 Features

- Total order count
- Total revenue
- Average order value
- Orders grouped by status
- Interactive bar chart
- Top 5 customers by total order value
- Real-time data retrieved from Snowflake
- Serverless API using Netlify Functions
- Loading and error handling in React

## 🏗️ Architecture

```text
React / Vite Frontend
        │
        │ fetch()
        ▼
Netlify Serverless Function
        │
        │ snowflake-sdk
        ▼
Snowflake
        │
        ▼
SNOWFLAKE_SAMPLE_DATA
        │
        ▼
TPCH_SF1
   ├── ORDERS
   └── CUSTOMER
```

The React frontend does **not** connect directly to Snowflake.

Instead, the frontend calls a Netlify serverless function. The function securely connects to Snowflake, executes SQL queries, and returns the results to React as JSON.

This keeps Snowflake credentials on the server side rather than exposing them in the browser.

## 🛠️ Technologies

### Frontend

- React
- Vite
- JavaScript
- CSS
- Recharts

### Backend

- Netlify Functions
- Node.js
- Snowflake Node.js SDK

### Data

- Snowflake
- SQL
- `SNOWFLAKE_SAMPLE_DATA.TPCH_SF1`

### Deployment

- GitHub
- Netlify

## 📈 Snowflake Analytics

The dashboard executes SQL queries against Snowflake to calculate business metrics.

Example:

```sql
SELECT
    COUNT(*) AS TOTAL_ORDERS,
    ROUND(SUM(O_TOTALPRICE), 2) AS TOTAL_REVENUE,
    ROUND(AVG(O_TOTALPRICE), 2) AS AVG_ORDER_VALUE
FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS;
```

The project also uses aggregation and joins to analyze order status and identify top customers.

## 🔐 Security

Snowflake credentials are stored using environment variables and are never committed to the repository.

Required environment variables:

```text
SNOWFLAKE_ACCOUNT
SNOWFLAKE_USER
SNOWFLAKE_PASSWORD
SNOWFLAKE_WAREHOUSE
SNOWFLAKE_DATABASE
SNOWFLAKE_SCHEMA
```

The local `.env` file is excluded through `.gitignore`.

## 💻 Running Locally

Clone the repository:

```bash
git clone <repository-url>
cd snowflake-sales-dashboard
```

Install dependencies:

```bash
npm install
```

Create a `.env` file containing your Snowflake connection configuration.

Then run the application through Netlify Dev:

```bash
npx netlify dev
```

Open:

```text
http://localhost:8888
```

## 🧠 What I Learned

This project gave me hands-on experience with:

- Querying cloud data with Snowflake and SQL
- Connecting Node.js to Snowflake
- Building serverless APIs with Netlify Functions
- Connecting a React frontend to an API using `fetch`
- Managing asynchronous data with `useEffect` and `useState`
- Keeping database credentials outside frontend code
- Transforming SQL results into JSON for frontend consumption
- Visualizing analytics data with React
- Debugging local development and deployment configuration

## 📁 Project Structure

```text
snowflake-sales-dashboard/
├── netlify/
│   └── functions/
│       └── dashboard.mjs
├── public/
├── src/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── .gitignore
├── netlify.toml
├── package.json
└── README.md
```


