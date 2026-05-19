import { Receipt, Settings, LayoutDashboard, PieChart, MoreHorizontal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './../styles/Sidebar.scss';
import { useState } from 'react';

export function Sidebar() {
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const menuItems = [
        { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'transactions', path: '/transactions', icon: Receipt, label: 'Transactions' },
        { id: 'analytics', path: '/analytics', icon: PieChart, label: 'Analytics' },
        { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo" onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
                {isCollapsed ? (
                    <MoreHorizontal size={24} color="white" />
                ) : (
                    <Receipt size={36} color="white" />
                )}
            </div>
            {!isCollapsed && (
                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;

                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`nav-item ${active ? 'active' : ''}`}
                                title={item.label}
                            >
                                <Icon size={36} />
                                <span className="tooltip">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            )}
        </aside>
    );
}
