#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://witty-meadow-095ac671e.6.azurestaticapps.net';

// List of all routes to test
const routes = [
  // Main routes
  '/',
  '/dashboard',
  '/profile',
  '/azure-status',
  '/sync-status',
  '/business-intelligence',
  '/notifications',
  '/productivity',
  '/monitoring',
  
  // Feature routes
  '/customers',
  '/vendors', 
  '/users',
  '/orders',
  '/quotes',
  '/invoices',
  '/margin-analysis',
  '/ai-margin-analysis',
  '/redline-report',
  '/forecast',
  '/approvals',
  '/my-approvals',
  '/rfp-gpt',
  '/rfp-management',
  '/apps',
  '/chats',
  '/tasks',
  '/help-center',
  '/gap-report',
  '/daily-wins',
  
  // Settings routes
  '/settings',
  '/settings/profile',
  '/settings/account',
  '/settings/appearance',
  '/settings/display',
  
  // Forms routes
  '/forms',
  '/forms/builder',
  '/forms/published',
  
  // Demo/Test routes
  '/editable-demo',
  '/editor-test',
  '/rich-text-demo',
  
  // Auth routes (should redirect)
  '/sign-in',
  '/sign-in-2',
  '/sign-up',
  '/forgot-password',
  '/otp',
  
  // Error pages
  '/401',
  '/403', 
  '/404',
  '/500',
  '/503'
];

// API endpoints to test
const apiEndpoints = [
  '/api/health',
  '/api/customers',
  '/api/vendors',
  '/api/users',
  '/api/orders',
  '/api/quotes',
  '/api/margin-analysis',
  '/api/user/complete-profile/test-user'
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          body: data,
          size: data.length
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        error: err.message,
        size: 0
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
        size: 0
      });
    });
  });
}

async function debugPages() {
  console.log('🔍 TOOLBOX PAGE DEBUGGING STARTED');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Testing ${routes.length} routes + ${apiEndpoints.length} API endpoints`);
  console.log('');
  
  const results = {
    pages: [],
    apis: [],
    summary: {
      total: 0,
      success: 0,
      errors: 0,
      redirects: 0,
      timeouts: 0
    }
  };
  
  // Test page routes
  console.log('📄 TESTING PAGE ROUTES');
  console.log('----------------------');
  
  for (const route of routes) {
    const url = `${BASE_URL}${route}`;
    const result = await makeRequest(url);
    results.pages.push(result);
    results.summary.total++;
    
    let status = '❌';
    if (result.status === 200) {
      status = '✅';
      results.summary.success++;
    } else if (result.status >= 300 && result.status < 400) {
      status = '🔄';
      results.summary.redirects++;
    } else if (result.status === 'TIMEOUT') {
      status = '⏰';
      results.summary.timeouts++;
    } else {
      results.summary.errors++;
    }
    
    console.log(`${status} ${route.padEnd(25)} | ${result.status} | ${(result.size/1024).toFixed(1)}KB`);
  }
  
  console.log('');
  console.log('🔌 TESTING API ENDPOINTS');
  console.log('------------------------');
  
  // Test API endpoints
  for (const endpoint of apiEndpoints) {
    const url = `https://tangram-marketing-functions.azurewebsites.net${endpoint}`;
    const result = await makeRequest(url);
    results.apis.push(result);
    results.summary.total++;
    
    let status = '❌';
    if (result.status === 200) {
      status = '✅';
      results.summary.success++;
    } else if (result.status >= 300 && result.status < 400) {
      status = '🔄';
      results.summary.redirects++;
    } else if (result.status === 'TIMEOUT') {
      status = '⏰';
      results.summary.timeouts++;
    } else {
      results.summary.errors++;
    }
    
    console.log(`${status} ${endpoint.padEnd(35)} | ${result.status} | ${(result.size/1024).toFixed(1)}KB`);
  }
  
  console.log('');
  console.log('📊 SUMMARY');
  console.log('----------');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Success: ${results.summary.success}`);
  console.log(`❌ Errors: ${results.summary.errors}`);
  console.log(`🔄 Redirects: ${results.summary.redirects}`);
  console.log(`⏰ Timeouts: ${results.summary.timeouts}`);
  console.log(`📈 Success Rate: ${((results.summary.success / results.summary.total) * 100).toFixed(1)}%`);
  
  // Identify specific issues
  console.log('');
  console.log('🚨 ISSUES FOUND');
  console.log('---------------');
  
  const issues = [...results.pages, ...results.apis].filter(r => 
    r.status !== 200 && r.status !== 302 && r.status !== 301
  );
  
  if (issues.length === 0) {
    console.log('🎉 No issues found! All pages and APIs are working correctly.');
  } else {
    issues.forEach(issue => {
      console.log(`❌ ${issue.url} - Status: ${issue.status} ${issue.error ? `(${issue.error})` : ''}`);
    });
  }
  
  // Save detailed results
  fs.writeFileSync('debug-results.json', JSON.stringify(results, null, 2));
  console.log('');
  console.log('💾 Detailed results saved to debug-results.json');
  
  return results;
}

// Run the debugging
debugPages().catch(console.error); 