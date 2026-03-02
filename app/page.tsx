'use client';

import React from 'react';

interface Metrics {
  cpu: number;
  memory: number;
  disk: number;
  load: number;
  timestamp: string;
  history?: Array<{
    cpu: number;
    memory: number;
    timestamp: string;
  }>;
}

interface ServiceStatus {
  name: string;
  status: 'up' | 'down' | 'error';
  responseTime: number;
  lastChecked: string;
  error?: string;
}

interface GitHubData {
  repos: number;
  stars: number;
  forks: number;
  languages: Array<[string, number]>;
  recentActivity: Array<{
    type: string;
    action: string;
    detail: string;
    repo: string;
    time: string;
  }>;
  openPRs: Array<{
    title: string;
    repo: string;
    number: number;
    url: string;
  }>;
}

export default function Home() {
  const [metrics, setMetrics] = React.useState<Metrics>({
    cpu: 0, memory: 0, disk: 0, load: 0, timestamp: ''
  });
  const [weather, setWeather] = React.useState<any>(null);
  const [github, setGithub] = React.useState<GitHubData | null>(null);
  const [services, setServices] = React.useState<{
    summary: { total: number; up: number; down: number; errors: number; overall: string };
    services: ServiceStatus[];
  } | null>(null);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'activity' | 'services'>('overview');
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch metrics
        const metricsRes = await fetch('/api/metrics');
        if (metricsRes.ok) setMetrics(await metricsRes.json());

        // Fetch weather
        const weatherRes = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=44.5&longitude=26.0&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m'
        );
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          setWeather(weatherData.current);
        }

        // Fetch GitHub
        const githubRes = await fetch('/api/github');
        if (githubRes.ok) setGithub(await githubRes.json());

        // Fetch services health
        const servicesRes = await fetch('/api/services');
        if (servicesRes.ok) setServices(await servicesRes.json());

        setLastUpdate(new Date());
      } catch (e) {
        console.error('Fetch error:', e);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 30000); // 30 second refresh
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';
    if (code < 3) return '🌤️';
    if (code < 50) return '☁️';
    if (code < 70) return '🌧️';
    if (code < 80) return '🌨️';
    return '⛈️';
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🔮 StefanOS V2</h1>
        <div style={styles.headerRight}>
          {lastUpdate && (
            <span style={styles.lastUpdate}>Updated {formatTime(lastUpdate.toISOString())}</span>
          )}
          <div style={styles.statusBadge}>
            <span style={styles.statusDot}></span>
            Live
          </div>
        </div>
      </header>

      <nav style={styles.nav}>
        {(['overview', 'activity', 'services'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.navButton,
              ...(activeTab === tab ? styles.navButtonActive : {})
            }}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'activity' && '🐙 Activity'}
            {tab === 'services' && '🔌 Services'}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div style={styles.grid}>
          {/* Weather Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>🌤️ Weather · Ganeasa</h2>
            </div>
            {weather ? (
              <>
                <div style={styles.weatherMain}>
                  <span style={styles.weatherIcon}>{getWeatherIcon(weather.weather_code)}</span>
                  <span style={styles.weatherTemp}>{Math.round(weather.temperature_2m)}°</span>
                </div>
                <div style={styles.weatherDetails}>
                  <div style={styles.weatherMetric}>
                    <span style={styles.weatherLabel}>Feels Like</span>
                    <span style={styles.weatherValue}>{Math.round(weather.apparent_temperature)}°</span>
                  </div>
                  <div style={styles.weatherMetric}>
                    <span style={styles.weatherLabel}>Humidity</span>
                    <span style={styles.weatherValue}>{weather.relative_humidity_2m}%</span>
                  </div>
                  <div style={styles.weatherMetric}>
                    <span style={styles.weatherLabel}>Wind</span>
                    <span style={styles.weatherValue}>{Math.round(weather.wind_speed_10m)} km/h</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.loading}>Loading weather...</div>
            )}
          </div>

          {/* System Metrics */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>📊 System Metrics</h2>
            </div>
            <MetricBar label="CPU" value={metrics.cpu} />
            <MetricBar label="Memory" value={metrics.memory} />
            <MetricBar label="Disk" value={metrics.disk} />
            <MetricBar label="Load" value={metrics.load} />
            
            {/* Mini sparkline */}
            {metrics.history && metrics.history.length > 0 && (
              <div style={styles.sparklineContainer}>
                <svg viewBox="0 0 100 20" style={styles.sparkline}>
                  <polyline
                    fill="none"
                    stroke="#58a6ff"
                    strokeWidth="0.5"
                    points={metrics.history.map((h, i) => {
                      const x = (i / (metrics.history!.length - 1)) * 100;
                      const y = 20 - (h.cpu / 100) * 20;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                </svg>
                <span style={styles.sparklineLabel}>CPU (24h)</span>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>📈 Quick Stats</h2>
            </div>
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{github?.repos || 0}</div>
                <div style={styles.statLabel}>Repos</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{github?.stars || 0}</div>
                <div style={styles.statLabel}>Stars</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{services?.summary.up || 0}/{services?.summary.total || 0}</div>
                <div style={styles.statLabel}>Services Up</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{github?.openPRs?.length || 0}</div>
                <div style={styles.statLabel}>Open PRs</div>
              </div>
            </div>
            
            {/* Top Languages */}
            {github?.languages && github.languages.length > 0 && (
              <div style={styles.languages}>
                <div style={styles.sectionLabel}>Top Languages</div>
                <div style={styles.languageTags}>
                  {github.languages.map(([lang, count]) => (
                    <span key={lang} style={styles.languageTag}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Open PRs */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>🔀 Open Pull Requests</h2>
            </div>
            {github?.openPRs && github.openPRs.length > 0 ? (
              <div style={styles.prList}>
                {github.openPRs.map((pr) => (
                  <a
                    key={`${pr.repo}-${pr.number}`}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.prItem}
                  >
                    <div style={styles.prRepo}>{pr.repo}</div>
                    <div style={styles.prTitle}>#{pr.number} {pr.title}</div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No open PRs 🎉</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div style={styles.singleColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>🐙 Recent GitHub Activity</h2>
            </div>
            {github?.recentActivity && github.recentActivity.length > 0 ? (
              <div style={styles.activityList}>
                {github.recentActivity.map((activity, i) => (
                  <div key={i} style={styles.activityItem}>
                    <div style={styles.activityIcon}>
                      {activity.type === 'PushEvent' && '⬆️'}
                      {activity.type === 'CreateEvent' && '✨'}
                      {activity.type === 'PullRequestEvent' && '🔀'}
                      {activity.type === 'IssuesEvent' && '📋'}
                      {activity.type === 'WatchEvent' && '⭐'}
                      {!['PushEvent', 'CreateEvent', 'PullRequestEvent', 'IssuesEvent', 'WatchEvent'].includes(activity.type) && '📌'}
                    </div>
                    <div style={styles.activityContent}>
                      <div style={styles.activityText}>
                        <strong>{activity.action}</strong> {activity.detail && <span>{activity.detail} </span>}
                        in <strong>{activity.repo}</strong>
                      </div>
                      <div style={styles.activityTime}>{getRelativeTime(activity.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No recent activity</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div style={styles.singleColumn}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>🔌 Service Health Monitor</h2>
              {services?.summary && (
                <span
                  style={{
                    ...styles.overallStatus,
                    background:
                      services.summary.overall === 'healthy'
                        ? '#238636'
                        : services.summary.overall === 'degraded'
                        ? '#f0883e'
                        : '#da3633'
                  }}
                >
                  {services.summary.overall.toUpperCase()}
                </span>
              )}
            </div>
            
            {services?.services ? (
              <div style={styles.serviceList}>
                {services.services.map((service) => (
                  <div key={service.name} style={styles.serviceItem}>
                    <div style={styles.serviceLeft}>
                      <span
                        style={{
                          ...styles.serviceDot,
                          background:
                            service.status === 'up'
                              ? '#238636'
                              : service.status === 'down'
                              ? '#da3633'
                              : '#f0883e',
                          boxShadow:
                            service.status === 'up'
                              ? '0 0 8px #238636'
                              : service.status === 'down'
                              ? '0 0 8px #da3633'
                              : '0 0 8px #f0883e'
                        }}
                      />
                      <span style={styles.serviceName}>{service.name}</span>
                    </div>
                    
                    <div style={styles.serviceRight}>
                      <span style={styles.serviceTime}>{service.responseTime}ms</span>
                      {service.error && (
                        <span style={styles.serviceError}>{service.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.loading}>Checking services...</div>
            )}
            
            <div style={styles.serviceNote}>
              Auto-refreshes every 30 seconds · Last check:{' '}
              {services?.services[0]?.lastChecked
                ? formatTime(services.services[0].lastChecked)
                : 'never'}
            </div>
          </div>
          
          {/* Quick Links */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>🔗 Quick Links</h2>
            </div>
            <div style={styles.linkGrid}>
              <a href="https://github.com/dekolor" target="_blank" rel="noopener" style={styles.linkCard}>
                <span style={styles.linkIcon}>🐙</span>
                <span style={styles.linkText}>GitHub</span>
              </a>
              <a href="https://reconcileai-demo.loca.lt" target="_blank" rel="noopener" style={styles.linkCard}>
                <span style={styles.linkIcon}>🤖</span>
                <span style={styles.linkText}>ReconcileAI</span>
              </a>
              <a href="https://filme-kohl.vercel.app" target="_blank" rel="noopener" style={styles.linkCard}>
                <span style={styles.linkIcon}>🎬</span>
                <span style={styles.linkText}>Filme</span>
              </a>
              <a href="https://awb-tracker-demo.vercel.app" target="_blank" rel="noopener" style={styles.linkCard}>
                <span style={styles.linkIcon}>📦</span>
                <span style={styles.linkText}>AWB Tracker</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v > 80) return '#da3633';
    if (v > 60) return '#f0883e';
    return '#238636';
  };

  return (
    <div style={styles.metricRow}>
      <div style={styles.metricHeader}>
        <span style={styles.metricLabel}>{label}</span>
        <span style={{ ...styles.metricValue, color: getColor(value) }}>
          {Math.round(value)}%
        </span>
      </div>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.barFill,
            width: `${Math.min(value, 100)}%`,
            background: getColor(value)
          }}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#0d1117',
    color: '#c9d1d9',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    fontSize: '2rem',
    background: 'linear-gradient(90deg, #58a6ff, #a371f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  lastUpdate: {
    color: '#8b949e',
    fontSize: '0.875rem'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#161b22',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    border: '1px solid #30363d'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    background: '#238636',
    borderRadius: '50%',
    boxShadow: '0 0 8px #238636',
    animation: 'pulse 2s infinite'
  },
  nav: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #30363d',
    paddingBottom: '0.5rem'
  },
  navButton: {
    background: 'transparent',
    border: 'none',
    color: '#8b949e',
    padding: '0.75rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  },
  navButtonActive: {
    background: '#1f6feb',
    color: '#fff'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1400px'
  },
  singleColumn: {
    maxWidth: '900px'
  },
  card: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '1.5rem'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  cardTitle: {
    fontSize: '1rem',
    color: '#58a6ff',
    margin: 0,
    fontWeight: 600
  },
  weatherMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    margin: '1.5rem 0'
  },
  weatherIcon: {
    fontSize: '3rem'
  },
  weatherTemp: {
    fontSize: '3rem',
    fontWeight: 700
  },
  weatherDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem'
  },
  weatherMetric: {
    background: '#0d1117',
    padding: '0.75rem',
    borderRadius: '8px',
    textAlign: 'center'
  },
  weatherLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#8b949e',
    textTransform: 'uppercase',
    marginBottom: '0.25rem'
  },
  weatherValue: {
    fontSize: '1.1rem',
    fontWeight: 600
  },
  metricRow: {
    marginBottom: '1rem'
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem'
  },
  metricLabel: {
    color: '#8b949e',
    fontSize: '0.875rem'
  },
  metricValue: {
    fontSize: '0.875rem',
    fontWeight: 600
  },
  barContainer: {
    background: '#0d1117',
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  sparklineContainer: {
    marginTop: '1rem',
    padding: '0.75rem',
    background: '#0d1117',
    borderRadius: '8px'
  },
  sparkline: {
    width: '100%',
    height: '40px'
  },
  sparklineLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#8b949e',
    marginTop: '0.5rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  statBox: {
    background: '#0d1117',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#58a6ff'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#8b949e',
    marginTop: '0.25rem',
    textTransform: 'uppercase'
  },
  sectionLabel: {
    fontSize: '0.75rem',
    color: '#8b949e',
    textTransform: 'uppercase',
    marginBottom: '0.5rem'
  },
  languages: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #30363d'
  },
  languageTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  languageTag: {
    background: '#238636',
    color: '#fff',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem'
  },
  prList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  prItem: {
    display: 'block',
    background: '#0d1117',
    padding: '0.75rem',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'background 0.2s',
    border: '1px solid transparent'
  },
  prRepo: {
    fontSize: '0.75rem',
    color: '#8b949e',
    marginBottom: '0.25rem'
  },
  prTitle: {
    fontSize: '0.9rem',
    color: '#58a6ff'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  activityItem: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
    padding: '0.75rem',
    background: '#0d1117',
    borderRadius: '8px'
  },
  activityIcon: {
    fontSize: '1.25rem',
    flexShrink: 0
  },
  activityContent: {
    flex: 1
  },
  activityText: {
    fontSize: '0.9rem',
    lineHeight: 1.5
  },
  activityTime: {
    fontSize: '0.75rem',
    color: '#8b949e',
    marginTop: '0.25rem'
  },
  overallStatus: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#fff'
  },
  serviceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: '#0d1117',
    borderRadius: '8px'
  },
  serviceLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  serviceDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  serviceName: {
    fontWeight: 500
  },
  serviceRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  serviceTime: {
    fontSize: '0.8rem',
    color: '#8b949e',
    fontFamily: 'monospace'
  },
  serviceError: {
    fontSize: '0.75rem',
    color: '#da3633'
  },
  serviceNote: {
    marginTop: '1rem',
    fontSize: '0.75rem',
    color: '#8b949e',
    textAlign: 'center'
  },
  linkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem'
  },
  linkCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem',
    background: '#0d1117',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, background 0.2s'
  },
  linkIcon: {
    fontSize: '1.5rem'
  },
  linkText: {
    fontSize: '0.8rem',
    color: '#8b949e'
  },
  loading: {
    textAlign: 'center',
    color: '#8b949e',
    padding: '2rem'
  },
  emptyState: {
    textAlign: 'center',
    color: '#8b949e',
    padding: '2rem',
    fontStyle: 'italic'
  }
};
