'use client';

import React from 'react';
import { ErrorBoundary, CardErrorBoundary } from '../components/ErrorBoundary';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '../components/KeyboardShortcuts';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import { ThemeToggle, ThemeSelector } from '../components/ThemeToggle';

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

const TABS = ['overview', 'activity', 'services', 'tasks'] as const;
type Tab = typeof TABS[number];

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export default function HomeWrapper() {
  return (
    <ThemeProvider>
      <Home />
    </ThemeProvider>
  );
}

function Home() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [metrics, setMetrics] = React.useState<Metrics>({
    cpu: 0, memory: 0, disk: 0, load: 0, timestamp: ''
  });
  const [weather, setWeather] = React.useState<any>(null);
  const [github, setGithub] = React.useState<GitHubData | null>(null);
  const [services, setServices] = React.useState<{
    summary: { total: number; up: number; down: number; errors: number; overall: string };
    services: ServiceStatus[];
  } | null>(null);
  const [activeTab, setActiveTab] = React.useState<Tab>('overview');
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = React.useState('');
  const [newTaskPriority, setNewTaskPriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [showTaskInput, setShowTaskInput] = React.useState(false);

  const fetchTasks = React.useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    }
  }, []);

  const addTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskText.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTaskText, priority: newTaskPriority }),
      });
      if (res.ok) {
        setNewTaskText('');
        setShowTaskInput(false);
        fetchTasks();
      }
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !completed }),
      });
      if (res.ok) fetchTasks();
    } catch (e) {
      console.error('Failed to toggle task:', e);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchTasks();
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  const fetchAll = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Fetch all data in parallel
      const [metricsRes, weatherRes, githubRes, servicesRes] = await Promise.allSettled([
        fetch('/api/metrics'),
        fetch('https://api.open-meteo.com/v1/forecast?latitude=44.5&longitude=26.0&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m'),
        fetch('/api/github'),
        fetch('/api/services')
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        setMetrics(await metricsRes.value.json());
      }

      if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
        const weatherData = await weatherRes.value.json();
        setWeather(weatherData.current);
      }

      if (githubRes.status === 'fulfilled' && githubRes.value.ok) {
        setGithub(await githubRes.value.json());
      }

      if (servicesRes.status === 'fulfilled' && servicesRes.value.ok) {
        setServices(await servicesRes.value.json());
      }

      setLastUpdate(new Date());
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
    fetchTasks();
    const interval = setInterval(() => {
      fetchAll();
      fetchTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll, fetchTasks]);

  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    onRefresh: fetchAll,
    onTabChange: (tab) => setActiveTab(tab as Tab),
    onToggleTheme: toggleTheme,
    tabs: [...TABS]
  });

  // Handle 'T' key for quick task add
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setActiveTab('tasks');
        setShowTaskInput(true);
        setTimeout(() => {
          const input = document.querySelector('[data-task-input]') as HTMLInputElement;
          input?.focus();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    <ErrorBoundary>
      <div style={styles.container}>
        <KeyboardShortcutsHelp visible={showHelp} onClose={() => setShowHelp(false)} />
        
        <header style={styles.header}>
          <h1 style={styles.title}>🔮 StefanOS V2</h1>
          <div style={styles.headerRight}>
            {lastUpdate && (
              <span style={styles.lastUpdate}>
                {isRefreshing ? '🔄 Updating...' : `Updated ${formatTime(lastUpdate.toISOString())}`}
              </span>
            )}
            <button 
              onClick={fetchAll} 
              style={styles.refreshButton}
              disabled={isRefreshing}
              title="Refresh (R)"
            >
              {isRefreshing ? '⏳' : '🔄'}
            </button>
            <button
              onClick={() => setShowHelp(true)}
              style={styles.helpButton}
              title="Keyboard shortcuts (?)"
            >
              ⌨️
            </button>
            <ThemeToggle />
            <div style={styles.statusBadge}>
              <span style={styles.statusDot}></span>
              Live
            </div>
          </div>
        </header>

        <nav style={styles.nav}>
          {TABS.map((tab, index) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.navButton,
                ...(activeTab === tab ? styles.navButtonActive : {})
              }}
              title={`${index + 1}`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'activity' && '🐙 Activity'}
              {tab === 'services' && '🔌 Services'}
              {tab === 'tasks' && `✅ Tasks ${tasks.filter(t => !t.completed).length > 0 ? `(${tasks.filter(t => !t.completed).length})` : ''}`}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' && (
          <div style={styles.grid}>
            <CardErrorBoundary title="Weather">
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
            </CardErrorBoundary>

            <CardErrorBoundary title="System Metrics">
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>📊 System Metrics</h2>
                </div>
                <MetricBar label="CPU" value={metrics.cpu} />
                <MetricBar label="Memory" value={metrics.memory} />
                <MetricBar label="Disk" value={metrics.disk} />
                <MetricBar label="Load" value={metrics.load} />
                
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
            </CardErrorBoundary>

            <CardErrorBoundary title="Quick Stats">
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
                
                {github?.languages && github.languages.length > 0 && (
                  <div style={styles.languages}>
                    <div style={styles.sectionLabel}>Top Languages</div>
                    <div style={styles.languageTags}>
                      {github.languages.map(([lang]) => (
                        <span key={lang} style={styles.languageTag}>{lang}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardErrorBoundary>

            <CardErrorBoundary title="Open Pull Requests">
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
            </CardErrorBoundary>
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={styles.singleColumn}>
            <CardErrorBoundary title="Recent GitHub Activity">
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
            </CardErrorBoundary>
          </div>
        )}

        {activeTab === 'services' && (
          <div style={styles.singleColumn}>
            <CardErrorBoundary title="Service Health Monitor">
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>🔌 Service Health Monitor</h2>
                  {services?.summary && (
                    <span
                      style={{
                        ...styles.overallStatus,
                        background: services.summary.overall === 'healthy' ? '#238636' 
                          : services.summary.overall === 'degraded' ? '#f0883e' : '#da3633'
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
                              background: service.status === 'up' ? '#238636' 
                                : service.status === 'down' ? '#da3633' : '#f0883e',
                              boxShadow: service.status === 'up' ? '0 0 8px #238636' 
                                : service.status === 'down' ? '0 0 8px #da3633' : '0 0 8px #f0883e'
                            }}
                          />
                          <span style={styles.serviceName}>{service.name}</span>
                        </div>
                        <div style={styles.serviceRight}>
                          <span style={styles.serviceTime}>{service.responseTime}ms</span>
                          {service.error && <span style={styles.serviceError}>{service.error}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.loading}>Checking services...</div>
                )}
                
                <div style={styles.serviceNote}>
                  Auto-refreshes every 30 seconds · Last check:{' '}
                  {services?.services[0]?.lastChecked ? formatTime(services.services[0].lastChecked) : 'never'}
                </div>
              </div>
            </CardErrorBoundary>
            
            <CardErrorBoundary title="Quick Links">
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
            </CardErrorBoundary>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div style={styles.singleColumn}>
            <CardErrorBoundary title="Task Manager">
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>✅ Tasks</h2>
                  <button
                    onClick={() => setShowTaskInput(!showTaskInput)}
                    style={styles.addButton}
                    title="Add new task (T)"
                  >
                    {showTaskInput ? '✕' : '+ Add Task'}
                  </button>
                </div>

                {showTaskInput && (
                  <form onSubmit={addTask} style={styles.taskForm}>
                    <input
                      data-task-input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="What needs to be done?"
                      style={styles.taskInput}
                      autoFocus
                    />
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                      style={styles.prioritySelect}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                    <button type="submit" style={styles.submitButton}>Add</button>
                  </form>
                )}

                <div style={styles.taskStats}>
                  <span style={styles.taskStat}>
                    <strong>{tasks.filter(t => !t.completed).length}</strong> pending
                  </span>
                  <span style={styles.taskStat}>
                    <strong>{tasks.filter(t => t.completed).length}</strong> done
                  </span>
                  <span style={styles.taskStat}>
                    <strong>{tasks.length}</strong> total
                  </span>
                </div>

                {tasks.length === 0 ? (
                  <div style={styles.emptyState}>
                    No tasks yet. Press <kbd style={styles.inlineKey}>T</kbd> to add one!
                  </div>
                ) : (
                  <div style={styles.taskList}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          ...styles.taskItem,
                          ...(task.completed ? styles.taskCompleted : {})
                        }}
                      >
                        <button
                          onClick={() => toggleTask(task.id, task.completed)}
                          style={styles.taskCheckbox}
                          title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {task.completed ? '☑️' : '⬜'}
                        </button>
                        <div style={styles.taskContent}>
                          <span style={styles.taskText}>{task.text}</span>
                          <span
                            style={{
                              ...styles.taskPriority,
                              background:
                                task.priority === 'high' ? '#da3633' :
                                task.priority === 'medium' ? '#f0883e' : '#238636'
                            }}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={styles.deleteButton}
                          title="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardErrorBoundary>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => v > 80 ? '#da3633' : v > 60 ? '#f0883e' : '#238636';

  return (
    <div style={styles.metricRow}>
      <div style={styles.metricHeader}>
        <span style={styles.metricLabel}>{label}</span>
        <span style={{ ...styles.metricValue, color: getColor(value) }}>{Math.round(value)}%</span>
      </div>
      <div style={styles.barContainer}>
        <div style={{ ...styles.barFill, width: `${Math.min(value, 100)}%`, background: getColor(value) }} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--bg-primary, #0d1117)',
    color: 'var(--text-primary, #c9d1d9)',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'background 0.3s ease, color 0.3s ease'
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
    background: 'linear-gradient(90deg, var(--accent-secondary, #58a6ff), #a371f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  lastUpdate: {
    color: 'var(--text-secondary, #8b949e)',
    fontSize: '0.875rem'
  },
  refreshButton: {
    background: 'var(--bg-secondary, #161b22)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s'
  },
  helpButton: {
    background: 'var(--bg-secondary, #161b22)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s'
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--bg-secondary, #161b22)',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    border: '1px solid var(--border-color, #30363d)'
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
    color: 'var(--text-secondary, #8b949e)',
    padding: '0.75rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  },
  navButtonActive: {
    background: 'var(--accent-primary, #1f6feb)',
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
    background: 'var(--card-bg, #161b22)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'background 0.3s ease, border-color 0.3s ease'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  cardTitle: {
    fontSize: '1rem',
    color: 'var(--accent-secondary, #58a6ff)',
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
    color: 'var(--accent-secondary, #58a6ff)'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary, #8b949e)',
    marginTop: '0.25rem',
    textTransform: 'uppercase'
  },
  sectionLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary, #8b949e)',
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
    color: 'var(--accent-secondary, #58a6ff)'
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
    color: 'var(--text-secondary, #8b949e)',
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
    color: 'var(--text-secondary, #8b949e)',
    padding: '2rem'
  },
  emptyState: {
    textAlign: 'center',
    color: 'var(--text-secondary, #8b949e)',
    padding: '2rem',
    fontStyle: 'italic'
  },
  // Task-related styles
  addButton: {
    background: '#238636',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'background 0.2s'
  },
  taskForm: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap' as const
  },
  taskInput: {
    flex: 1,
    minWidth: '200px',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#c9d1d9',
    fontSize: '0.9rem'
  },
  prioritySelect: {
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#c9d1d9',
    fontSize: '0.9rem',
    cursor: 'pointer'
  },
  submitButton: {
    background: '#1f6feb',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500
  },
  taskStats: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    padding: '0.75rem',
    background: '#0d1117',
    borderRadius: '8px'
  },
  taskStat: {
    fontSize: '0.85rem',
    color: '#8b949e'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    background: '#0d1117',
    borderRadius: '8px',
    transition: 'opacity 0.2s',
    border: '1px solid transparent'
  },
  taskCompleted: {
    opacity: 0.6
  },
  taskCheckbox: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.25rem',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  taskContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap' as const
  },
  taskText: {
    flex: 1,
    fontSize: '0.9rem'
  },
  taskPriority: {
    fontSize: '0.7rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '10px',
    color: '#fff',
    textTransform: 'uppercase' as const,
    fontWeight: 600
  },
  deleteButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem',
    opacity: 0.6,
    transition: 'opacity 0.2s'
  },
  inlineKey: {
    background: '#30363d',
    border: '1px solid #484f58',
    borderRadius: '4px',
    padding: '0.125rem 0.375rem',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#c9d1d9'
  }
};
