//src /Transaction.tsx
import { Sidebar } from "../components/Sidebar";

export default function Transactions() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
            <Sidebar />
            <div>
                <h1>Control Painel</h1>
                <p>WelCome to Transactions</p>
            </div>
        </div>
    );
}