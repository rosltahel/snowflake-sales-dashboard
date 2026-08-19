import snowflake from "snowflake-sdk";

function connectToSnowflake() {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT,
    username: process.env.SNOWFLAKE_USER,
    password: process.env.SNOWFLAKE_PASSWORD,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
    database: process.env.SNOWFLAKE_DATABASE,
    schema: process.env.SNOWFLAKE_SCHEMA,
  });
}

function executeQuery(connection, sqlText) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      },
    });
  });
}

export default async () => {
  const connection = connectToSnowflake();

  try {
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });

    const rows = await executeQuery(
      connection,
      `
        SELECT
          COUNT(*) AS TOTAL_ORDERS,
          ROUND(SUM(O_TOTALPRICE), 2) AS TOTAL_REVENUE,
          ROUND(AVG(O_TOTALPRICE), 2) AS AVG_ORDER_VALUE
        FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS
      `
    );

    const statusRows = await executeQuery(
      connection,
      `
        SELECT
          O_ORDERSTATUS AS STATUS,
          COUNT(*) AS TOTAL
        FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS
        GROUP BY O_ORDERSTATUS
        ORDER BY TOTAL DESC
      `
    );

    const customerRows = await executeQuery(
        connection,
        `
          SELECT
            C.C_NAME AS CUSTOMER_NAME,
            COUNT(*) AS TOTAL_ORDERS,
            ROUND(SUM(O.O_TOTALPRICE), 2) AS TOTAL_SPENT
          FROM SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.ORDERS O
          JOIN SNOWFLAKE_SAMPLE_DATA.TPCH_SF1.CUSTOMER C
            ON O.O_CUSTKEY = C.C_CUSTKEY
          GROUP BY C.C_NAME
          ORDER BY TOTAL_SPENT DESC
          LIMIT 5
        `
    );

    const result = rows[0];

    return new Response(
      JSON.stringify({
        totalOrders: Number(result.TOTAL_ORDERS),
        totalRevenue: Number(result.TOTAL_REVENUE),
        averageOrderValue: Number(result.AVG_ORDER_VALUE),

        ordersByStatus: statusRows.map((row) => ({
          status: row.STATUS,
          total: Number(row.TOTAL),

        topCustomers: customerRows.map((row) => ({
          name: row.CUSTOMER_NAME,
          orders: Number(row.TOTAL_ORDERS),
          totalSpent: Number(row.TOTAL_SPENT),
        })),
        })),
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Snowflake error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to load Snowflake data",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } finally {
    connection.destroy(() => {});
  }
};