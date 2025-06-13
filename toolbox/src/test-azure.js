console.log('🚀 Testing Azure Integration'); fetch('/api/health').then(r => r.json()).then(d => console.log('Azure Health:', d)).catch(e => console.error('Azure Error:', e));
