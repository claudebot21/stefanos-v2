import React from 'react';

export default function Home() {
  const [metrics, setMetrics] = React.useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    load: 0
  });
  const [weather, setWeather] = React.useState<any>(null);
  const [github, setGithub] = React.useState<any>(null);

  React.useEffect(() => {
    // Fetch metrics
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (e) {}
    };

    // Fetch weather
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.5&longitude=26.0&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');
        const data = await res.json();
        setWeather(data.current);
      } catch (e) {}
    };

    // Fetch GitHub
    const fetchGithub = async () => {
      try {
        const res = await fetch('https://api.github.com/users/dekolor/repos?per_page=100');
        const data = await res.json();
        setGithub({ repos: data.length });
      } catch (e) {}
    };

    fetchMetrics();
    fetchWeather();
    fetchGithub();

    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔮 StefanOS V2</h1>
      
      <div style={styles.grid}>
        {/* Weather */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🌤️ Weather · Ganeasa</h2>
          {weather ? (
            <>
              <div style={styles.weatherMain}>
                {weather.weather_code === 0 ? '☀️' : weather.weather_code < 3 ? '🌤️' : '☁️'}
              </div>
              <div style={styles.weatherTemp}>{Math.round(weather.temperature_2m)}°C</div>
              <div style={styles.weatherDetails}>
                <div style={styles.metric}>
                  <div style={styles.metricLabel}>Feels Like</div>
                  <div style={styles.metricValue}>{Math.round(weather.apparent_temperature)}°</div>
                </div>
                <div style={styles.metric}>
                  <div style={styles.metricLabel}>Humidity</div>
                  <div style={styles.metricValue}>{weather.relative_humidity_2m}%</div>
                </div>
                <div style={styles.metric}>
                  <div style={styles.metricLabel}>Wind</div>
                  <div style={styles.metricValue}>{Math.round(weather.wind_speed_10m)} km/h</div>
                </div>
              </div>
            </>
          ) : (
            <div style={styles.loading}>Loading...</div>
          )}
        </div>

        {/* System Metrics */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 System Metrics (LIVE)</h2>
          <MetricBar label="CPU" value={metrics.cpu} />
          <MetricBar label="Memory" value={metrics.memory} />
          <MetricBar label="Disk" value={metrics.disk} />
          <MetricBar label="Load" value={metrics.load} />
        </div>

        {/* GitHub */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🐙 GitHub</h2>
          {github ? (
            <div style={styles.githubStats}>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>{github.repos}</div>
                <div style={styles.statLabel}>Repositories</div>
              </div>
            </div>
          ) : (
            <div style={styles.loading}>Loading...</div>
          )}
        </div>

        {/* Status */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🔌 Status</h2>
          <div style={styles.statusItem}>
            <span style={styles.statusDot}></span>
            <span>Kimi Claw Core - Online</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusDot}></span>
            <span>Memory System - Active</span>
          </div>
          <div style={styles.statusItem}>
            <span style={styles.statusDot}></span>
            <span>Autonomous Agents - 5/5</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.metricRow}>
      <div style={styles.metricHeader}>
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div style={styles.barContainer}>
        <div style={{
          ...styles.barFill,
          width: `${Math.min(value, 100)}%`,
          background: value > 80 ? '#da3633' : value > 60 ? '#f0883e' : '#238636'
        }} />
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
  title: {
    fontSize: '2.5rem',
    background: 'linear-gradient(90deg, #58a6ff, #a371f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
    marginBottom: '2rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  card: {
    background: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '12px',
    padding: '1.5rem'
  },
  cardTitle: {
    fontSize: '1.1rem',
    color: '#58a6ff',
    marginBottom: '1rem'
  },
  weatherMain: {
    fontSize: '3rem',
    textAlign: 'center',
    margin: '1rem 0'
  },
  weatherTemp: {
    fontSize: '2.5rem',
    textAlign: 'center',
    fontWeight: 600
  },
  weatherDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginTop: '1rem'
  },
  metric: {
    background: '#0d1117',
    padding: '0.75rem',
    borderRadius: '8px',
    textAlign: 'center'
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: '#8b949e',
    textTransform: 'uppercase'
  },
  metricValue: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginTop: '0.25rem'
  },
  metricRow: {
    marginBottom: '1rem'
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem'
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
    transition: 'width 0.3s'
  },
  githubStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem'
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
    fontSize: '0.8rem',
    color: '#8b949e',
    marginTop: '0.25rem'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    background: '#0d1117',
    borderRadius: '8px',
    marginBottom: '0.5rem'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    background: '#238636',
    borderRadius: '50%',
    boxShadow: '0 0 8px #238636'
  },
  loading: {
    textAlign: 'center',
    color: '#8b949e',
    padding: '2rem'
  }
};