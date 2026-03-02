import { NextResponse } from 'next/server';

interface Service {
  name: string;
  url: string;
  type: 'http' | 'tunnel';
}

const SERVICES: Service[] = [
  { name: 'ReconcileAI Demo', url: 'https://reconcileai-demo.loca.lt/health', type: 'tunnel' },
  { name: 'StefanOS Dashboard', url: 'https://stefanos-v2.vercel.app/api/health', type: 'http' },
  { name: 'Filme App', url: 'https://filme-kohl.vercel.app', type: 'http' },
  { name: 'AWB Tracker', url: 'https://awb-tracker-demo.vercel.app', type: 'http' },
];

async function checkService(service: Service): Promise<{
  name: string;
  status: 'up' | 'down' | 'error';
  responseTime: number;
  lastChecked: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'StefanOS-HealthCheck/1.0' }
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - start;
    
    return {
      name: service.name,
      status: res.ok ? 'up' : 'down',
      responseTime,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: service.name,
      status: 'error',
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  try {
    const results = await Promise.all(SERVICES.map(checkService));
    
    const up = results.filter(r => r.status === 'up').length;
    const down = results.filter(r => r.status === 'down').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    return NextResponse.json({
      summary: {
        total: results.length,
        up,
        down,
        errors,
        overall: down === 0 && errors === 0 ? 'healthy' : errors > 0 ? 'degraded' : 'issues'
      },
      services: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      summary: { total: 0, up: 0, down: 0, errors: 0, overall: 'unknown' },
      services: [],
      error: 'Health check failed'
    }, { status: 500 });
  }
}
