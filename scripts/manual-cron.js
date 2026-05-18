const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables from .env file
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

// Configuration
const APP_URL = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SECRET = env.CRON_SECRET || env.METRICS_SECRET || 'your_random_secret_here';

// Dynamic intervals (in milliseconds)
const FOLLOWUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const METRICS_INTERVAL = 5 * 60 * 1000;   // 5 minutes

console.log('\n🚀 STANDALONE MANUAL CRONJOB RUNNER STARTED');
console.log('============================================');
console.log(`Target Host:       ${APP_URL}`);
console.log(`Follow-up Check:   Every 10 minutes`);
console.log(`Metrics Push:      Every 5 minutes`);
console.log('============================================\n');

// 2. Task 1: Follow-up Reminders Alert Trigger
async function triggerFollowups() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🔔 Checking follow-ups...`);
  
  try {
    const res = await fetch(`${APP_URL}/api/cron/notify-followups?secret=${SECRET}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET}`
      }
    });
    
    const text = await res.text();
    if (res.ok) {
      try {
        const json = JSON.parse(text);
        console.log(`[${timestamp}] ✅ Follow-ups finished successfully! Alerts triggered: ${json.followUpAlerts}, Reminders triggered: ${json.reminderAlerts}`);
      } catch {
        console.log(`[${timestamp}] ⚠️ Follow-ups responded with code ${res.status} but body was not JSON.`);
      }
    } else {
      console.log(`[${timestamp}] ❌ Follow-ups failed: Status Code ${res.status}. Error: ${text}`);
    }
  } catch (err) {
    console.error(`[${timestamp}] ❌ Follow-ups Network Error:`, err.message);
  }
}

// 3. Task 2: Grafana Telemetry Metrics Push
async function triggerMetricsPush() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 📈 Pushing telemetry metrics to Grafana...`);
  
  try {
    const res = await fetch(`${APP_URL}/api/push-metrics`, {
      method: 'GET',
      headers: {
        'x-metrics-token': SECRET,
        'Authorization': `Bearer ${SECRET}`
      }
    });
    
    const text = await res.text();
    if (res.ok) {
      try {
        const json = JSON.parse(text);
        console.log(`[${timestamp}] ✅ Metrics pushed successfully! Active series synced: ${json.pushed}`);
      } catch {
        console.log(`[${timestamp}] ⚠️ Metrics push responded with code ${res.status} but body was not JSON.`);
      }
    } else {
      console.log(`[${timestamp}] ❌ Metrics push failed: Status Code ${res.status}. Error: ${text}`);
    }
  } catch (err) {
    console.error(`[${timestamp}] ❌ Metrics push Network Error:`, err.message);
  }
}

// 4. Run immediately on startup
triggerFollowups();
triggerMetricsPush();

// 5. Schedule intervals
setInterval(triggerFollowups, FOLLOWUP_INTERVAL);
setInterval(triggerMetricsPush, METRICS_INTERVAL);
