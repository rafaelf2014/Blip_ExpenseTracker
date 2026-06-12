import { useState } from 'react';
import { Receipt, Settings, LayoutDashboard, PieChart, Wallet, ChevronLeft, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import './../styles/Sidebar.scss';

const STORAGE_KEY = 'blip_sidebar_collapsed';

export function Sidebar() {
    const location = useLocation();
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
    const isLight = theme === 'light';

    const toggle = () => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            return next;
        });
    };

    const menuItems = [
        { id: 'dashboard',    path: '/dashboard',    icon: LayoutDashboard, label: t('dashboard.title') },
        { id: 'transactions', path: '/transactions', icon: Receipt,         label: t('transactions.title') },
        { id: 'analytics',    path: '/analytics',    icon: PieChart,        label: t('analytics.title') },
        { id: 'planning',     path: '/planning',     icon: Wallet,          label: t('planning.title') },
        { id: 'settings',     path: '/settings',     icon: Settings,        label: t('settings.title') },
    ];

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-brand">
                <div className="sidebar-logo">
                    <Receipt size={26} color="white" />
                </div>
                {!collapsed && <span className="sidebar-brand-name">BLIP</span>}
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;

                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`nav-item ${active ? 'active' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={22} className="nav-icon" />
                            <span className="nav-label">{item.label}</span>
                            {collapsed && <span className="tooltip">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
                    title={isLight ? 'Dark mode' : 'Light mode'}
                >
                    <span className={`theme-icon ${!isLight ? 'active' : ''}`}><Moon size={18} /></span>
                    <span className={`theme-icon ${isLight ? 'active' : ''}`}><Sun size={18} /></span>
                    <span className={`theme-knob ${isLight ? 'right' : ''}`} />
                </button>

                <button
                    className="sidebar-toggle"
                    onClick={toggle}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    <ChevronLeft size={20} className="toggle-icon" />
                </button>
            </div>
        </aside>
    );
}
