import { NextResponse } from 'next/server';

const GITHUB_USERNAME = 'dekolor';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchGitHub(path: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'StefanOS-Dashboard'
  };
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    // Fetch repos
    const repos = await fetchGitHub(`/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
    
    // Fetch recent events
    const events = await fetchGitHub(`/users/${GITHUB_USERNAME}/events?per_page=30`);
    
    // Process activity
    const activity = events.slice(0, 10).map((event: any) => {
      const repoName = event.repo?.name?.replace(`${GITHUB_USERNAME}/`, '') || 'unknown';
      let action = '';
      let detail = '';
      
      switch (event.type) {
        case 'PushEvent':
          action = 'pushed';
          detail = `${event.payload?.commits?.length || 0} commit(s)`;
          break;
        case 'CreateEvent':
          action = 'created';
          detail = event.payload?.ref_type || 'repository';
          break;
        case 'PullRequestEvent':
          action = event.payload?.action;
          detail = `PR #${event.payload?.pull_request?.number}`;
          break;
        case 'IssuesEvent':
          action = event.payload?.action;
          detail = `issue #${event.payload?.issue?.number}`;
          break;
        case 'WatchEvent':
          action = 'starred';
          detail = '';
          break;
        default:
          action = event.type.replace('Event', '').toLowerCase();
      }
      
      return {
        type: event.type,
        action,
        detail,
        repo: repoName,
        time: event.created_at
      };
    });
    
    // Calculate stats
    const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum: number, repo: any) => sum + repo.forks_count, 0);
    const languages = repos
      .filter((r: any) => r.language)
      .reduce((acc: Record<string, number>, r: any) => {
        acc[r.language] = (acc[r.language] || 0) + 1;
        return acc;
      }, {});
    
    // Get recent PRs across repos
    const recentPRs = [];
    for (const repo of repos.slice(0, 5)) {
      try {
        const prs = await fetchGitHub(`/repos/${GITHUB_USERNAME}/${repo.name}/pulls?state=open&per_page=5`);
        recentPRs.push(...prs.map((pr: any) => ({
          title: pr.title,
          repo: repo.name,
          number: pr.number,
          url: pr.html_url
        })));
      } catch {
        // Skip repos with errors
      }
    }
    
    return NextResponse.json({
      repos: repos.length,
      stars: totalStars,
      forks: totalForks,
      languages: Object.entries(languages)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5),
      recentActivity: activity,
      openPRs: recentPRs.slice(0, 5),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('GitHub API error:', error);
    return NextResponse.json({
      repos: 0,
      stars: 0,
      forks: 0,
      languages: [],
      recentActivity: [],
      openPRs: [],
      error: 'Failed to fetch GitHub data'
    }, { status: 500 });
  }
}
