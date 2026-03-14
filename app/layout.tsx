export const metadata = {
  title: 'StefanOS V2',
  description: 'Real-time Personal Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('stefanos-theme') || 'dark';
                const resolved = theme === 'system' 
                  ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
                  : theme;
                document.documentElement.setAttribute('data-theme', resolved);
                document.documentElement.style.colorScheme = resolved;
              })();
            `,
          }}
        />
        <style>{`
          :root {
            /* Dark theme (default) */
            --bg-primary: #0d1117;
            --bg-secondary: #161b22;
            --bg-tertiary: #0d1117;
            --text-primary: #c9d1d9;
            --text-secondary: #8b949e;
            --border-color: #30363d;
            --accent-primary: #1f6feb;
            --accent-secondary: #58a6ff;
            --success: #238636;
            --warning: #f0883e;
            --danger: #da3633;
            --card-bg: #161b22;
          }

          [data-theme="light"] {
            --bg-primary: #ffffff;
            --bg-secondary: #f6f8fa;
            --bg-tertiary: #ffffff;
            --text-primary: #1f2328;
            --text-secondary: #656d76;
            --border-color: #d0d7de;
            --accent-primary: #0969da;
            --accent-secondary: #0969da;
            --success: #1a7f37;
            --warning: #9a6700;
            --danger: #cf222e;
            --card-bg: #ffffff;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: var(--bg-primary);
            color: var(--text-primary);
            transition: background 0.3s ease, color 0.3s ease;
          }

          /* Scrollbar theming */
          ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }

          ::-webkit-scrollbar-track {
            background: var(--bg-secondary);
          }

          ::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 5px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
          }

          /* Selection theming */
          ::selection {
            background: var(--accent-primary);
            color: white;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
