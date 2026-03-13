<script lang="ts">
    let { children } = $props();

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/kanban', label: 'Kanban Board', icon: '📋' },
        { href: '/admin/settings', label: 'Settings', icon: '⚙️' }
    ];

    let currentPath = $state('');

    $effect(() => {
        if (typeof window !== 'undefined') {
            currentPath = window.location.pathname;
        }
    });
</script>

<div class="admin-shell">
    <aside class="admin-sidebar">
        <div class="sidebar-brand">
            <span class="brand-icon">⚡</span>
            <span class="brand-text">VASpeak Admin</span>
        </div>
        <nav class="sidebar-nav">
            {#each navItems as item}
                <a
                    href={item.href}
                    class="nav-link"
                    class:active={currentPath === item.href}
                >
                    <span class="nav-icon">{item.icon}</span>
                    <span class="nav-label">{item.label}</span>
                </a>
            {/each}
        </nav>
        <div class="sidebar-footer">
            <a href="/" class="nav-link back-link">
                <span class="nav-icon">←</span>
                <span class="nav-label">Back to Site</span>
            </a>
        </div>
    </aside>
    <main class="admin-main">
        {@render children()}
    </main>
</div>

<style>
    .admin-shell {
        display: flex;
        min-height: 100vh;
        background: #0f1729;
        color: #e2e8f0;
        font-family: 'Inter', system-ui, sans-serif;
    }

    .admin-sidebar {
        width: 240px;
        background: #1a2332;
        border-right: 1px solid #2d3a4d;
        display: flex;
        flex-direction: column;
        padding: 0;
        flex-shrink: 0;
    }

    .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 18px;
        border-bottom: 1px solid #2d3a4d;
    }

    .brand-icon {
        font-size: 1.3rem;
    }

    .brand-text {
        font-size: 1rem;
        font-weight: 700;
        color: #f2a906;
        letter-spacing: 0.02em;
    }

    .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 12px 10px;
        flex: 1;
    }

    .nav-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        text-decoration: none;
        color: #94a3b8;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.15s ease;
    }

    .nav-link:hover {
        background: #243044;
        color: #e2e8f0;
    }

    .nav-link.active {
        background: #f2a90615;
        color: #f2a906;
    }

    .nav-icon {
        font-size: 1.1rem;
        width: 24px;
        text-align: center;
    }

    .sidebar-footer {
        padding: 10px;
        border-top: 1px solid #2d3a4d;
    }

    .back-link {
        color: #64748b;
    }

    .admin-main {
        flex: 1;
        padding: 28px 32px;
        overflow-y: auto;
    }

    @media (max-width: 768px) {
        .admin-shell {
            flex-direction: column;
        }
        .admin-sidebar {
            width: 100%;
            flex-direction: row;
            border-right: none;
            border-bottom: 1px solid #2d3a4d;
        }
        .sidebar-brand {
            border-bottom: none;
            padding: 12px 14px;
        }
        .sidebar-nav {
            flex-direction: row;
            padding: 8px;
            gap: 4px;
        }
        .sidebar-footer {
            border-top: none;
            padding: 8px;
        }
        .nav-label {
            display: none;
        }
        .admin-main {
            padding: 20px 16px;
        }
    }
</style>
