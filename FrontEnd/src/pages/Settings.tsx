import { User, Save, Lock } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import '../styles/Settings.scss';

export default function Settings() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    // State for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (storedName) setUsername(storedName);
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent page refresh on form submission
        setLoading(true);
        const oldUsername = localStorage.getItem('username');
        try {
            const response = await fetch('http://localhost:5000/api/users/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldUsername, newUsername: username }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('username', username);
                toast.success(data.message);
            }
            else {
                toast.error(data.error || 'Failed to update username');
            }
        } catch (error) {
            console.error('Error updating username:', error);
            toast.error('An error occurred while updating the username');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return toast.error("New passwords do not match!");
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/users/update-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: localStorage.getItem('username'),
                    currentPassword,
                    newPassword
                }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error connecting to the server");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="settings-layout">
            <Sidebar />

            <main className="settings-page">
                {/* Header*/}
                <div className="settings-header">
                    <h1>Settings</h1>
                    <p>Manage your account and preferences</p>
                </div>

                {/* Layout Grid */}
                <div className="settings-grid">

                    {/* Settings Card */}
                    <div className="settings-card">
                        {/* Profile Card */}
                        <div className="settings-card">
                            {/* Header  Card */}
                            <div className="card-header">
                                <div className="icon-wrapper">
                                    <User size={20} color="white" />
                                </div>
                                <h2>Profile</h2>
                            </div>

                            {/* Settings Form */}
                            <form className="settings-form" onSubmit={handleSave}>
                                <div className="form-group">
                                    <label>Username</label>
                                    <input className="form-control"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        required
                                    />
                                </div>

                                <button type="submit" className="save-button" disabled={loading}>
                                    <Save size={18} />
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                        {/* Security Card */}
                        <div className="settings-card">
                            <div className="card-header">
                                <div className="icon-wrapper">
                                    <Lock size={20} color="white" />
                                </div>
                                <h2>Security</h2>
                            </div>

                            <form className="settings-form" onSubmit={handlePasswordSave}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input className="form-control"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input className="form-control"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter your new password"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        className="form-control"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>

                                <button type="submit" className="save-button" disabled={loading}>
                                    <Save size={18} />
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>

    );
}