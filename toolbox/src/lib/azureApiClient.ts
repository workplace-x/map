export const azureApi = { getOrders: () => fetch('/api/order-intelligence'), getQuotes: () => fetch('/api/quote-intelligence'), healthCheck: () => fetch('/api/health') };
