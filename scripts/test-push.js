const fs = require('fs');
const path = require('path');

// Load and parse .env manually to avoid external dependency issues
const envPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  });
}

const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const secret = env.CRON_SECRET || env.METRICS_SECRET || 'any-random-secret-string-you-choose';

console.log('\n🧪 PUSH METRICS DIAGNOSTIC TOOL');
console.log('=================================');
console.log(`Target Host: ${appUrl}`);
console.log(`Endpoint:    ${appUrl}/api/push-metrics`);
console.log(`Secret Token: ${secret}`);
console.log('---------------------------------');
console.log('⏳ Dispatching GET request...');

fetch(`${appUrl}/api/push-metrics`, {
  method: 'GET',
  headers: {
    'x-metrics-token': secret,
    Authorization: `Bearer ${secret}`,
  },
})
  .then(async (res) => {
    const text = await res.text();
    console.log(`\n📥 Status Code: ${res.status} (${res.statusText})`);
    
    try {
      const json = JSON.parse(text);
      console.log('Response Payload:', JSON.stringify(json, null, 2));
      if (res.ok && (json.success || json.ok)) {
        console.log('\n✅ SUCCESS: Telemetry was successfully registered and pushed to Grafana!');
      } else {
        console.log('\n❌ FAILED: The server rejected the push trigger.');
      }
    } catch {
      console.log('Raw Response:', text);
      console.log('\n❌ FAILED: The server returned an invalid or HTML response.');
    }
  })
  .catch((err) => {
    console.error('\n❌ NETWORK ERROR:', err.message);
    console.log('Make sure your Next.js local development server is running ("npm run dev")!');
  });
