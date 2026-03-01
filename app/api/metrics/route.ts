import { execSync } from 'child_process';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get CPU usage
    const cpu = Math.floor(Math.random() * 40) + 20; // Simulated for demo
    
    // Get memory usage
    const memInfo = execSync('free -m | grep Mem').toString();
    const memParts = memInfo.trim().split(/\s+/);
    const total = parseInt(memParts[1]);
    const used = parseInt(memParts[2]);
    const memory = Math.round((used / total) * 100);
    
    // Get disk usage
    const diskInfo = execSync('df -h / | tail -1').toString();
    const diskParts = diskInfo.trim().split(/\s+/);
    const disk = parseInt(diskParts[4].replace('%', ''));
    
    // Get load average
    const loadInfo = execSync('uptime | awk -F"load average:" \'{print $2}\'').toString();
    const load = parseFloat(loadInfo.trim().split(',')[0]);
    const loadPercent = Math.min(Math.round((load / 4) * 100), 100); // Assuming 4 cores
    
    return NextResponse.json({
      cpu,
      memory,
      disk,
      load: loadPercent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      cpu: 0,
      memory: 0,
      disk: 0,
      load: 0,
      error: 'Failed to fetch metrics'
    }, { status: 500 });
  }
}