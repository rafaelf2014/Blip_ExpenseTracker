import { User, Save, Lock } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { useState, useEffect } from "react";


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
                alert(data.message);
            }
            else {
                alert(data.error || 'Failed to update username');
            }
        } catch (error) {
            console.error('Error updating username:', error);
            alert('An error occurred while updating the username');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return alert("New passwords do not match!");
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
                alert(data.message);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Error connecting to the server");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#0F172A' }}>
            <Sidebar />

            <main className="settings-page">
                {/* Header*/}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>Settings</h1>
                    <p style={{ color: '#94A3B8' }}>Manage your account and preferences</p>
                </div>

                {/* Layout Grid */}
                <div className="settings-grid">

                    {/* Settings Card */}
                    <div className="main-settings">
                        {/* Profile Card */}
                        <div className="settings-card">
                            {/* Header  Card */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} color="white" />
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Profile</h2>
                            </div>

                            {/* Settings Form */}
                            <form className="settings-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Lock size={20} color="white" />
                                </div>
                                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Security</h2>
                            </div>
                            <form className="settings-form" onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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