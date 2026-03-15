import { Sidebar } from "../components/Sidebar";

export default function Settings() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
            <Sidebar />
            <div>
                <h1>Control Painel</h1>
                <p>WellCome to Settings</p>
            </div>
        </div>
    );
}