<script lang="ts">
    import type { LayoutData } from "./$types";
    import { page } from "$app/stores";

    interface Props {
        data: LayoutData;
        children: import("svelte").Snippet;
    }

    let { data, children }: Props = $props();

    let sidebarCollapsed = $state(false);
    let commandPaletteOpen = $state(false);
    let searchQuery = $state("");
    let theme = $state<"dark" | "light">("dark");
    let mounted = $state(false);

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: "grid", href: "/office" },
        { id: "users", label: "Users", icon: "users", href: "/office/users" },
        {
            id: "newsletter",
            label: "Newsletter",
            icon: "mail",
            href: "/office/newsletter",
        },
        {
            id: "settings",
            label: "Settings",
            icon: "settings",
            href: "/office/settings",
        },
    ];

    const filteredNavItems = $derived(
        searchQuery.trim()
            ? navItems.filter((item) =>
                  item.label
                      .toLowerCase()
                      .includes(searchQuery.trim().toLowerCase()),
              )
            : navItems,
    );

    function isActive(href: string): boolean {
        const path = $page.url.pathname;
        if (href === "/office") {
            return path === "/office";
        }
        return path.startsWith(href);
    }

    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
    }

    function openCommandPalette() {
        commandPaletteOpen = true;
    }

    function closeCommandPalette() {
        commandPaletteOpen = false;
        searchQuery = "";
    }

    function toggleTheme() {
        theme = theme === "dark" ? "light" : "dark";
        if (typeof window !== "undefined") {
            localStorage.setItem("office-theme", theme);
        }
    }

    $effect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("office-theme") as
                | "dark"
                | "light"
                | null;
            if (saved) theme = saved;
            mounted = true;
        }
    });

    $effect(() => {
        function handleKeydown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                openCommandPalette();
            }
            if (e.key === "Escape" && commandPaletteOpen) {
                closeCommandPalette();
            }
        }
        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    });
</script>

<svelte:head>
    <title>Office — VASpeak</title>
</svelte:head>

{#if data.authenticated}
    <div
        class="office-layout flex h-screen transition-colors duration-300 {mounted
            ? theme
            : 'dark'}"
        style:--office-bg={theme === "dark" ? "#0a0a0b" : "#fafafa"}
        style:--office-surface={theme === "dark" ? "#141415" : "#ffffff"}
        style:--office-surface-hover={theme === "dark" ? "#1c1c1e" : "#f4f4f5"}
        style:--office-border={theme === "dark" ? "#27272a" : "#e4e4e7"}
        style:--office-text={theme === "dark" ? "#fafafa" : "#18181b"}
        style:--office-text-muted={theme === "dark" ? "#71717a" : "#71717a"}
        style:--office-accent="#f2a906"
        style:--office-accent-muted={theme === "dark"
            ? "rgba(242, 169, 6, 0.15)"
            : "rgba(242, 169, 6, 0.2)"}
    >
        <!-- Sidebar -->
        <aside
            class="flex flex-col border-r border-[var(--office-border)] bg-[var(--office-surface)] transition-all duration-300 {sidebarCollapsed
                ? 'w-16'
                : 'w-60'}"
        >
            <!-- Logo -->
            <div
                class="flex items-center h-14 px-4 border-b border-[var(--office-border)]"
            >
                {#if !sidebarCollapsed}
                    <div class="flex items-center gap-2">
                        <div
                            class="w-7 h-7 rounded-lg bg-[var(--office-accent)] flex items-center justify-center"
                        >
                            <span
                                class="text-xs font-bold text-[var(--office-bg)]"
                                >V</span
                            >
                        </div>
                        <span class="font-semibold text-sm">VASpeak</span>
                    </div>
                {:else}
                    <div
                        class="w-7 h-7 rounded-lg bg-[var(--office-accent)] flex items-center justify-center mx-auto"
                    >
                        <span class="text-xs font-bold text-[var(--office-bg)]"
                            >V</span
                        >
                    </div>
                {/if}
            </div>

            <!-- Navigation -->
            <nav class="flex-1 p-2 space-y-1">
                {#each navItems as item}
                    <a
                        href={item.href}
                        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--office-surface-hover)] text-[var(--office-text-muted)] hover:text-[var(--office-text)]"
                        class:bg-[var(--office-accent-muted)]={isActive(
                            item.href,
                        )}
                        class:text-[var(--office-accent)]={isActive(item.href)}
                    >
                        <svg
                            class="w-4 h-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {#if item.icon === "grid"}
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                                />
                            {:else if item.icon === "users"}
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            {:else if item.icon === "mail"}
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            {:else if item.icon === "settings"}
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            {/if}
                        </svg>
                        {#if !sidebarCollapsed}
                            <span>{item.label}</span>
                        {/if}
                    </a>
                {/each}
            </nav>

            <!-- Bottom actions -->
            <div class="p-2 border-t border-[var(--office-border)]">
                <button
                    onclick={toggleSidebar}
                    aria-label={sidebarCollapsed
                        ? "Expand sidebar"
                        : "Collapse sidebar"}
                    class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--office-text-muted)] hover:text-[var(--office-text)] hover:bg-[var(--office-surface-hover)] transition-colors"
                >
                    <svg
                        class="w-4 h-4 transition-transform {sidebarCollapsed
                            ? 'rotate-180'
                            : ''}"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                        />
                    </svg>
                </button>
            </div>
        </aside>

        <!-- Main content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <header
                class="h-14 flex items-center justify-between px-6 border-b border-[var(--office-border)] bg-[var(--office-surface)]"
            >
                <button
                    onclick={openCommandPalette}
                    class="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--office-bg)] border border-[var(--office-border)] text-[var(--office-text-muted)] text-sm hover:border-[var(--office-text-muted)] transition-colors"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <span>Search...</span>
                    <kbd
                        class="px-1.5 py-0.5 rounded text-xs bg-[var(--office-surface)] text-[var(--office-text-muted)]"
                        >⌘K</kbd
                    >
                </button>

                <div class="flex items-center gap-3">
                    <button
                        onclick={toggleTheme}
                        class="p-2 rounded-lg text-[var(--office-text-muted)] hover:text-[var(--office-text)] hover:bg-[var(--office-surface-hover)] transition-colors"
                        title={theme === "dark"
                            ? "Switch to light mode"
                            : "Switch to dark mode"}
                    >
                        {#if theme === "dark"}
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                />
                            </svg>
                        {:else}
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                />
                            </svg>
                        {/if}
                    </button>
                    <a
                        href="/"
                        class="text-xs text-[var(--office-text-muted)] hover:text-[var(--office-text)] transition-colors"
                    >
                        View Site →
                    </a>
                    <form method="POST" action="/office/logout">
                        <button
                            type="submit"
                            class="text-xs text-[var(--office-text-muted)] hover:text-[var(--office-accent)] transition-colors"
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </header>

            <!-- Page content -->
            <main class="flex-1 overflow-auto p-6">
                {@render children()}
            </main>
        </div>

        <!-- Command Palette -->
        {#if commandPaletteOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="fixed inset-0 {theme === 'dark'
                    ? 'bg-black/60'
                    : 'bg-black/40'} backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
                onclick={closeCommandPalette}
                role="none"
            >
                <div
                    class="w-full max-w-xl bg-[var(--office-surface)] border border-[var(--office-border)] rounded-xl shadow-2xl overflow-hidden"
                    onclick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Command palette"
                    tabindex="0"
                >
                    <!-- Search input -->
                    <div
                        class="flex items-center gap-3 px-4 py-3 border-b border-[var(--office-border)]"
                    >
                        <svg
                            class="w-5 h-5 text-[var(--office-text-muted)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            bind:value={searchQuery}
                            placeholder="Type a command or search..."
                            class="flex-1 bg-transparent text-[var(--office-text)] placeholder:text-[var(--office-text-muted)] outline-none text-sm"
                        />
                        <kbd
                            class="px-1.5 py-0.5 rounded text-xs bg-[var(--office-bg)] text-[var(--office-text-muted)] border border-[var(--office-border)]"
                            >ESC</kbd
                        >
                    </div>

                    <!-- Results -->
                    <div class="max-h-80 overflow-auto p-2">
                        <div
                            class="px-3 py-1.5 text-xs font-medium text-[var(--office-text-muted)] uppercase tracking-wider"
                        >
                            Quick Actions
                        </div>
                        {#each filteredNavItems as item}
                            <a
                                href={item.href}
                                onclick={closeCommandPalette}
                                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[var(--office-surface-hover)] transition-colors"
                            >
                                <span class="text-[var(--office-text-muted)]"
                                    >→</span
                                >
                                <span>{item.label}</span>
                            </a>
                        {:else}
                            <p
                                class="px-3 py-4 text-sm text-center text-[var(--office-text-muted)]"
                            >
                                No results for "{searchQuery}"
                            </p>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </div>
{:else}
    {@render children()}
{/if}
