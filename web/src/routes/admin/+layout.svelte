<script lang="ts">
    import {
        LayoutDashboard, Kanban, Users, BookOpen, Mail,
        Video, Settings, ArrowLeft, Zap
    } from 'lucide-svelte';

    let { children } = $props();

    const navGroups = [
        {
            label: 'Overview',
            items: [
                { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { href: '/admin/kanban', label: 'Kanban Board', icon: Kanban },
            ]
        },
        {
            label: 'Content',
            items: [
                { href: '/admin/users', label: 'Users', icon: Users },
                { href: '/admin/lessons', label: 'Lessons', icon: BookOpen },
                { href: '/admin/waitlist', label: 'Waitlist', icon: Mail },
            ]
        },
        {
            label: 'System',
            items: [
                { href: '/admin/e2e-testing', label: 'E2E Testing', icon: Video },
                { href: '/admin/settings', label: 'Settings', icon: Settings },
            ]
        }
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
            <span class="brand-icon"><Zap size={18} /></span>
            <span class="brand-text">VASpeak Admin</span>
        </div>
        <nav class="sidebar-nav">
            {#each navGroups as group}
                <div class="nav-group-label">{group.label}</div>
                {#each group.items as item}
                    <a
                        href={item.href}
                        class="nav-link"
                        class:active={currentPath === item.href}
                    >
                        <span class="nav-icon"><svelte:component this={item.icon} size={16} /></span>
                        <span class="nav-label">{item.label}</span>
                    </a>
                {/each}
            {/each}
        </nav>
        <div class="sidebar-footer">
            <a href="/" class="nav-link back-link">
                <span class="nav-icon"><ArrowLeft size={16} /></span>
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
        background: #f8f9fb;
        color: #1e293b;
        font-family: 'Inter', system-ui, sans-serif;
    }

    .admin-sidebar {
        width: 240px;
        background: #ffffff;
        border-right: 1px solid #e8ecf1;
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
        border-bottom: 1px solid #e8ecf1;
    }

    .brand-icon {
        color: #f2a906;
        display: flex;
        align-items: center;
    }

    .brand-text {
        font-size: 1rem;
        font-weight: 700;
        color: #1B365D;
        letter-spacing: 0.02em;
    }

    .sidebar-nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 12px 10px;
        flex: 1;
    }

    .nav-group-label {
        font-size: 0.62rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #94a3b8;
        padding: 10px 12px 4px;
        margin-top: 4px;
    }

    .nav-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        text-decoration: none;
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.15s ease;
    }

    .nav-link:hover {
        background: #f1f5f9;
        color: #1e293b;
    }

    .nav-link.active {
        background: #fef8e7;
        color: #b07d04;
    }

    .nav-icon {
        display: flex;
        align-items: center;
        width: 20px;
        justify-content: center;
    }

    .sidebar-footer {
        padding: 10px;
        border-top: 1px solid #e8ecf1;
    }

    .back-link {
        color: #94a3b8;
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
            border-bottom: 1px solid #e8ecf1;
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
        .nav-group-label {
            display: none;
        }
        .admin-main {
            padding: 20px 16px;
        }
    }
</style>
