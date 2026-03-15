import { Receipt, Settings, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './../styles/Sidebar.scss';

export function Sidebar() {
    /* Identify which page the user is on*/
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'transactions', path: '/transactions', icon: Receipt, label: 'Transactions' },
        { id: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Receipt size={28} color="white" />
            </div>

            {/* Navigation*/}
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
                            <Icon size={24} />
                            <span className="tooltip">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
