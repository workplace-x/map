const { app } = require('@azure/functions');
const sql = require('mssql');

// Database configuration
const dbConfig = {
  server: "tangram-datalake-prod.database.windows.net",
  port: 1433,
  database: "Tangram_Datalake_Prod",
  user: "TangramReporting",
  password: "3PJ1yL7HVUp4kFRcLNtj",
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// CORS configuration for production
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tangram-toolbox-webapp.azurewebsites.net',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

// Helper function to add CORS headers
function addCorsHeaders(response) {
  if (!response.headers) {
    response.headers = {};
  }
  Object.assign(response.headers, corsHeaders);
  return response;
}

// Simple Azure AD Authentication Middleware
function authenticateAzureAD(req) {
  // Skip auth for certain endpoints
  if (req.url.includes('/health') || req.url.includes('/rfp-gpt/')) {
    return { authenticated: true, user: { id: 'rfp-gpt-user', email: 'rfp-gpt@tangraminteriors.com', name: 'RFP GPT User' } };
  }

  const authHeader = req.headers.Authorization || req.headers.authorization;
  
  if (!authHeader) {
    return { authenticated: false, error: 'No authorization header' };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }

  try {
    // Basic token decode (without verification for now)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { authenticated: false, error: 'Invalid token format' };
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    
    // Verify this is an Azure AD token
    if (!payload.iss || (!payload.iss.includes('microsoftonline.com') && !payload.iss.includes('sts.windows.net'))) {
      return { authenticated: false, error: 'Only Azure AD authentication is supported' };
    }

    // Create user profile from Azure AD token
    const user = {
      id: payload.sub || payload.oid,
      email: payload.preferred_username || payload.email || payload.upn,
      name: payload.name || payload.preferred_username || 'Azure AD User',
      avatar_url: null,
      role: 'user',
      team: null,
      isLeader: false
    };

    return { authenticated: true, user };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token: ' + error.message };
  }
}

// Health check endpoint
app.http("health", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "health",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }

    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request().query("SELECT COUNT(*) as count FROM AP_VENDORS");
      await pool.close();
      
      return addCorsHeaders({
        status: 200,
        jsonBody: {
          status: "healthy",
          vendor_count: result.recordset[0].count,
          region: "West US 2",
          message: "All systems operational - CORS enabled",
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {
      return addCorsHeaders({
        status: 200,
        jsonBody: {
          status: "ready",
          message: "System deployed - awaiting database activation",
          error: e.message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }
});

// User complete profile endpoint
app.http("completeUserProfile", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "user/complete-profile/{azureId}",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }

    const azureId = req.params.azureId;
    
    return addCorsHeaders({
      status: 200,
      jsonBody: {
        azureId: azureId,
        email: azureId + "@tangraminteriors.com",
        name: "Azure User",
        tenantId: "ef032c9f-5bea-4839-b1c7-7fc37efef46a",
        isEmployee: true,
        profile: {
          user_id: azureId,
          AzureID: azureId,
          name: "Azure User",
          email: azureId + "@tangraminteriors.com",
          jobtitle: "Employee",
          department: "General",
          accountenabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        role: {
          id: null,
          supabase_user_id: azureId,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        teams: [],
        targets: [],
        accountMapping: {
          id: null,
          azure_id: azureId,
          salesforce_user_id: null,
          erp_salesperson_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        primaryTeam: null,
        isTeamLeader: false,
        currentMonthTarget: null,
        targetProgress: 0,
        permissions: ["reports.read", "approvals.read"]
      }
    });
  }
});

// RFP GPT Chat Sessions endpoint
app.http('chatSessions', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'api/chat/sessions',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }
    
    try {
      if (request.method === 'GET') {
        // Return mock chat sessions
        const sessions = [
          {
            id: 'session-1',
            title: 'Healthcare RFP Discussion',
            documentUrl: '',
            uploadedAt: new Date().toISOString(),
            messages: [],
            user: {
              id: 'user-1',
              email: 'user@tangraminteriors.com',
              name: 'Production User'
            }
          }
        ];
        
        return addCorsHeaders({
          status: 200,
          jsonBody: sessions
        });
      }
      
      if (request.method === 'POST') {
        const body = await request.json();
        
        // Create new chat session
        const newSession = {
          id: `session-${Date.now()}`,
          title: body.title || 'New Chat',
          created_at: new Date().toISOString(),
          user: {
            id: 'user-1',
            email: 'user@tangraminteriors.com',
            name: 'Production User'
          },
          messages: []
        };
        
        return addCorsHeaders({
          status: 201,
          jsonBody: newSession
        });
      }
    } catch (error) {
      context.log.error('Error in RFP GPT chats:', error);
      
      return addCorsHeaders({
        status: 500,
        jsonBody: {
          error: 'Failed to process chat request',
          message: error.message
        }
      });
    }
  }
});

// RFP GPT Chat Messages endpoint
app.http('chatMessages', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'api/chat/sessions/{sessionId}/messages',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }
    
    try {
      const sessionId = request.params.sessionId;
      
      if (request.method === 'GET') {
        // Return mock messages
        const messages = [
          {
            id: 'msg-1',
            content: 'Hello! How can I help you with your RFP today?',
            sender: 'assistant',
            timestamp: new Date().toISOString()
          }
        ];
        
        return addCorsHeaders({
          status: 200,
          jsonBody: messages
        });
      }
      
      if (request.method === 'POST') {
        const body = await request.json();
        
        // Create new message and mock AI response
        const userMessage = {
          id: `msg-${Date.now()}`,
          content: body.content,
          sender: 'user',
          timestamp: new Date().toISOString()
        };
        
        const aiResponse = {
          id: `msg-${Date.now() + 1}`,
          content: `I understand you're asking about: "${body.content}". This is a mock response from the AI Composer. In production, this would be powered by OpenAI GPT-4 with your RFP knowledge base.`,
          sender: 'assistant',
          timestamp: new Date(Date.now() + 1000).toISOString()
        };
        
        return addCorsHeaders({
          status: 201,
          jsonBody: {
            userMessage,
            aiResponse,
            sessionId
          }
        });
      }
    } catch (error) {
      context.log.error('Error in RFP GPT messages:', error);
      
      return addCorsHeaders({
        status: 500,
        jsonBody: {
          error: 'Failed to process message request',
          message: error.message
        }
      });
    }
  }
});

// Existing endpoints with CORS
app.http("customers", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "customers",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        success: true,
        data: [
          {"customer_number": "CUST001", "customer_name": "Sample Customer 1"},
          {"customer_number": "CUST002", "customer_name": "Sample Customer 2"}
        ],
        count: 2,
        source: "mock_data"
      }
    });
  }
});

app.http("vendors", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "vendors",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        success: true,
        data: [
          {"vendor_number": "VEND001", "vendor_name": "Sample Vendor 1"},
          {"vendor_number": "VEND002", "vendor_name": "Sample Vendor 2"}
        ],
        count: 2,
        source: "mock_data"
      }
    });
  }
});

app.http("users", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "users",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        success: true,
        data: [
          {"salesperson_number": "SP001", "name": "John Doe"},
          {"salesperson_number": "SP002", "name": "Jane Smith"}
        ],
        count: 2,
        source: "mock_data"
      }
    });
  }
});

app.http("orders", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "orders",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        success: true,
        data: [
          {"order_number": "ORD001", "customer_number": "CUST001"},
          {"order_number": "ORD002", "customer_number": "CUST002"}
        ],
        count: 2,
        source: "mock_data"
      }
    });
  }
});

app.http("quotes", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "quotes",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({
        status: 200,
        body: null
      });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        success: true,
        data: [],
        count: 0,
        message: "Quotes endpoint ready",
        source: "mock_data"
      }
    });
  }
});

// Dashboard Analytics Endpoints

// Total Booked This Month
app.http("totalBookedThisMonth", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-booked-this-month",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 285000.50, count: 42, currency: 'USD' }
    });
  }
});

// Total Booked This Year
app.http("totalBookedThisYear", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-booked-this-year",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 3420000.75, count: 456, currency: 'USD' }
    });
  }
});

// Total Booked This Week
app.http("totalBookedThisWeek", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-booked-this-week",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 67000.25, count: 12, currency: 'USD' }
    });
  }
});

// Total Booked Yesterday
app.http("totalBookedYesterday", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-booked-yesterday",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 15000.00, count: 3, currency: 'USD' }
    });
  }
});

// Total Invoiced This Month
app.http("totalInvoicedThisMonth", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-invoiced-this-month",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 198000.75, count: 28, currency: 'USD' }
    });
  }
});

// Total Invoiced This Year
app.http("totalInvoicedThisYear", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-invoiced-this-year",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 2890000.50, count: 387, currency: 'USD' }
    });
  }
});

// Total Invoiced This Week
app.http("totalInvoicedThisWeek", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-invoiced-this-week",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 45000.25, count: 8, currency: 'USD' }
    });
  }
});

// Total Invoiced Yesterday
app.http("totalInvoicedYesterday", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/total-invoiced-yesterday",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: { total: 12000.00, count: 2, currency: 'USD' }
    });
  }
});

// Bookings Leaderboard - GP This Month
app.http("bookingsLeaderboardGPThisMonth", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/bookings-leaderboard-gp-this-month",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        leaderboard: [
          { name: "Sarah Johnson", gp: 45000.75, orders: 12 },
          { name: "Mike Chen", gp: 38000.50, orders: 9 },
          { name: "Lisa Garcia", gp: 32000.25, orders: 8 },
          { name: "David Wilson", gp: 28000.00, orders: 7 },
          { name: "Emma Thompson", gp: 24000.50, orders: 6 }
        ]
      }
    });
  }
});

// Bookings Leaderboard - Sales This Month
app.http("bookingsLeaderboardSalesThisMonth", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "api/bookings-leaderboard-sales-this-month",
  handler: async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return addCorsHeaders({ status: 200, body: null });
    }

    const auth = authenticateAzureAD(req);
    if (!auth.authenticated) {
      return addCorsHeaders({ status: 401, jsonBody: { error: auth.error } });
    }

    return addCorsHeaders({
      status: 200,
      jsonBody: {
        leaderboard: [
          { name: "Sarah Johnson", sales: 125000.75, orders: 15 },
          { name: "Mike Chen", sales: 98000.50, orders: 12 },
          { name: "Lisa Garcia", sales: 87000.25, orders: 11 },
          { name: "David Wilson", sales: 72000.00, orders: 9 },
          { name: "Emma Thompson", sales: 65000.50, orders: 8 }
        ]
      }
    });
  }
});

module.exports = app; 