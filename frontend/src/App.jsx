import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, ReceiptText, ChefHat, User, ArrowLeft, UserPlus, Utensils, TrendingUp } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Cardapio from './pages/Cardapio';
import Comandas from './pages/Comandas';
import Garcons from './pages/Garcons';
import AutoCadastro from './pages/AutoCadastro';
import AutoPedido from './pages/AutoPedido';
import Relatorios from './pages/Relatorios';

function App() {
  const [userRole, setUserRole] = useState(null); // 'CLIENTE' | 'FUNCIONARIO'

  if (!userRole) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '3rem', textAlign: 'center' }}>
          <div className="flex justify-center mb-6">
            <div style={{ background: 'var(--accent-gradient)', padding: '1.5rem', borderRadius: '50%' }}>
              <ChefHat size={64} color="white" />
            </div>
          </div>
          <h1 className="mb-2" style={{ fontSize: '2.5rem' }}>Baratie</h1>
          <p className="text-secondary mb-8" style={{ fontSize: '1.1rem' }}>Bem-vindo. Selecione seu perfil de acesso:</p>
          
          <div className="flex flex-col gap-4">
            <button className="btn btn-primary" onClick={() => setUserRole('CLIENTE')} style={{ padding: '1.2rem', fontSize: '1.2rem' }}>
              Sou Cliente
            </button>
            <button className="btn btn-outline" onClick={() => setUserRole('FUNCIONARIO')} style={{ padding: '1.2rem', fontSize: '1.2rem' }}>
              Sou Funcionário
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <div className="flex items-center gap-4 mb-8">
            <div style={{ background: 'var(--accent-gradient)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <ChefHat size={32} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}>Baratie</h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{userRole === 'CLIENTE' ? 'Autoatendimento' : 'Administração'}</span>
            </div>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {userRole === 'FUNCIONARIO' ? (
              <>
                <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <LayoutDashboard size={20} /> Dashboard
                </NavLink>
                <NavLink to="/clientes" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} /> Clientes
                </NavLink>
                <NavLink to="/cardapio" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <BookOpen size={20} /> Cardápio
                </NavLink>
                <NavLink to="/garcons" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <User size={20} /> Garçons
                </NavLink>
                <NavLink to="/comandas" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ReceiptText size={20} /> Comandas
                </NavLink>
                <NavLink to="/relatorios" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <TrendingUp size={20} /> Relatórios
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/auto-cadastro" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <UserPlus size={20} /> Meu Cadastro
                </NavLink>
                <NavLink to="/auto-pedido" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Utensils size={20} /> Fazer Pedido
                </NavLink>
              </>
            )}

            <button className="btn btn-outline mt-8" onClick={() => setUserRole(null)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginTop: 'auto' }}>
              <ArrowLeft size={20} /> Sair do Perfil
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            {userRole === 'FUNCIONARIO' ? (
              <>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/cardapio" element={<Cardapio />} />
                <Route path="/garcons" element={<Garcons />} />
                <Route path="/comandas" element={<Comandas />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/auto-cadastro" />} />
                <Route path="/auto-cadastro" element={<AutoCadastro />} />
                <Route path="/auto-pedido" element={<AutoPedido />} />
                <Route path="*" element={<Navigate to="/auto-cadastro" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
