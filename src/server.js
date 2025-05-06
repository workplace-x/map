const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();
const { parseMoney } = require('./utils');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root route - API documentation
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        version: '1.0.0',
        endpoints: {
            'GET /': 'API documentation and health check',
            'GET /api/orders/:orderNo/margin': 'Get margin analysis for a specific order number'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Helper to convert BigInt to string recursively
function convertBigIntToString(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : convertBigIntToString(v)])
    );
  }
  return obj;
}

// Get order margin by order number
app.get('/api/orders/:orderNo/margin', async (req, res) => {
    try {
        const orderNo = parseInt(req.params.orderNo);
        
        // Get order header with customer and salesperson info
        const orderHeaderResult = await prisma.$queryRaw`
            SELECT oh.*, 
                   oh.title as order_title,
                   c.name AS customer_name, 
                   sp.name AS salesperson_name
            FROM ods_hds_orderheader oh
            LEFT JOIN ods_hds_customer c ON oh.customer_no = c.customer_no AND oh.organization_id = c.organization_id
            LEFT JOIN ods_hds_salesperson sp ON oh.salesperson_id_1 = sp.salesperson_id
            WHERE oh.order_no = ${orderNo}
            LIMIT 1
        `;

        if (!orderHeaderResult || orderHeaderResult.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const orderHeader = orderHeaderResult[0];

        // Get order lines with vendor name and margin
        const orderLines = await prisma.$queryRaw`
            SELECT ol.*, 
                   v.vendor_name, 
                   (ol.unit_sell::money::numeric::float8 - ol.unit_cost::money::numeric::float8) AS margin
            FROM ods_hds_orderline ol
            LEFT JOIN ods_hds_vendor v ON ol.vnd_no = v.vnd_no AND ol.organization_id = v.organization_id
            WHERE ol.order_index = ${orderHeader.order_index}
        `;

        // Calculate order level totals
        const orderTotals = orderLines.reduce((acc, line) => {
            acc.totalCost += Number(line.unit_cost) * Number(line.qty_ordered);
            acc.totalSell += Number(line.unit_sell) * Number(line.qty_ordered);
            return acc;
        }, { totalCost: 0, totalSell: 0 });

        // Calculate order level margin
        const orderMargin = orderTotals.totalSell === 0 ? 0 : 
            ((orderTotals.totalSell - orderTotals.totalCost) / orderTotals.totalSell) * 100;

        // Add margin_pct to each order line (based on total sell and total cost for the line)
        const linesWithMarginPct = orderLines.map(line => {
            const unitSell = Number(line.unit_sell);
            const unitCost = Number(line.unit_cost);
            const qtyOrdered = Number(line.qty_ordered);
            const totalSell = unitSell * qtyOrdered;
            const totalCost = unitCost * qtyOrdered;
            const marginPct = totalSell === 0 ? 0 : ((totalSell - totalCost) / totalSell) * 100;
            return {
                ...line,
                margin_pct: marginPct
            };
        });

        // Calculate order level margin percentage (based on total sell and total cost)
        const orderMarginPct = orderTotals.totalSell === 0 ? 0 :
            ((orderTotals.totalSell - orderTotals.totalCost) / orderTotals.totalSell) * 100;

        // Combine all data
        const response = {
            ...orderHeader,
            customer_name: orderHeader.customer_name,
            salesperson_name: orderHeader.salesperson_name,
            order_title: orderHeader.order_title,
            ...orderTotals,
            orderMargin,
            orderMarginPct,
            lines: linesWithMarginPct
        };

        res.json(convertBigIntToString(response));
    } catch (error) {
        console.error('Error calculating margin:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get all active quotes (order_type = 'Q') from the last 6 months, filtered by salesperson_id (required)
app.get('/api/quotes/active', async (req, res) => {
  try {
    const salesperson_id = req.query.salesperson_id;
    if (!salesperson_id) {
      return res.status(400).json({ error: 'Missing required query parameter: salesperson_id' });
    }
    // Fetch all active quote headers for the given salesperson
    const quoteHeaders = await prisma.$queryRaw`
      SELECT 
        oh.order_no AS quote_no,
        oh.title AS order_title,
        c.name AS customer_name,
        sp.name AS salesperson_name,
        oh.date_entered::text AS date_created,
        oh.order_status AS status,
        oh.company_code,
        oh.order_index
      FROM ods_hds_orderheader oh
      LEFT JOIN ods_hds_customer c ON oh.customer_no = c.customer_no AND oh.company_code = c.company_code
      LEFT JOIN ods_hds_salesperson sp ON oh.salesperson_id_1 = sp.salesperson_id
      WHERE oh.order_type = 'Q'
        AND oh.date_entered >= (CURRENT_DATE - INTERVAL '6 months')
        AND oh.salesperson_id_1 = ${salesperson_id}
      ORDER BY oh.date_entered DESC
    `;

    // For each quote, fetch and sum order lines
    const quotes = await Promise.all(quoteHeaders.map(async q => {
      const orderLines = await prisma.$queryRaw`
        SELECT unit_sell, unit_cost, qty_ordered
        FROM ods_hds_orderline
        WHERE company_code = ${q.company_code} AND order_index = ${q.order_index}
      `;
      let total_sell = 0;
      let total_cost = 0;
      orderLines.forEach(line => {
        const unitSell = parseMoney(line.unit_sell);
        const unitCost = parseMoney(line.unit_cost);
        const qtyOrdered = Number(line.qty_ordered) || 0;
        total_sell += unitSell * qtyOrdered;
        total_cost += unitCost * qtyOrdered;
      });
      const overall_margin_pct = total_sell === 0 ? 0 : ((total_sell - total_cost) / total_sell) * 100;
      return {
        ...q,
        total_sell,
        total_cost,
        overall_margin_pct: Number(overall_margin_pct.toFixed(2)),
        low_margin_line_count: 0 // Placeholder, can be updated if needed
      };
    }));

    res.json(quotes);
  } catch (error) {
    console.error('Error fetching active quotes:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get all salespeople (for dropdown)
app.get('/api/salespeople', async (req, res) => {
  try {
    const salespeople = await prisma.$queryRaw`
      SELECT salesperson_id AS id, name FROM ods_hds_salesperson ORDER BY name ASC
    `;
    res.json(salespeople);
  } catch (error) {
    console.error('Error fetching salespeople:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});