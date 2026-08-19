import { useEffect, useState } from "react";
import "./App.css";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/.netlify/functions/dashboard")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }

        return response.json();
      })
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (!data) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="app">
      <h1>Snowflake Sales Analytics</h1>

      <p className="subtitle">
        Dashboard powered by Snowflake sample data
      </p>

      <div className="cards">
        <div className="card">
          <h3>Total Orders</h3>
          <p>{data.totalOrders.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Total Revenue</h3>
          <p>${data.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="card">
          <h3>Average Order Value</h3>
          <p>${data.averageOrderValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="chart-section">
        <h2>Orders by Status</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.ordersByStatus}>
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="customers-section">
  <h2>Top Customers</h2>
  <p className="section-subtitle">
    Top 5 customers ranked by total order value
  </p>

  <table className="customers-table">
    <thead>
      <tr>
        <th>Customer</th>
        <th>Orders</th>
        <th>Total Spent</th>
      </tr>
    </thead>

    <tbody>
      {data.topCustomers.map((customer) => (
        <tr key={customer.name}>
          <td>{customer.name}</td>
          <td>{customer.orders.toLocaleString()}</td>
          <td>
            ${customer.totalSpent.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>

    
  );
}

export default App;