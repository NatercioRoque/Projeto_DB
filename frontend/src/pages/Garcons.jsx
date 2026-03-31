import { useEffect, useState } from 'react';
import axios from 'axios';
import { User, UserPlus, Trash2, CalendarDays, DollarSign, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function Garcons() {
  const [garcons, setGarcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nome: '', data_admicao: '', salario: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Paginação e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchGarcons = async () => {
    try {
      const res = await api.get('/garcons');
      setGarcons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGarcons() }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.data_admicao || !formData.salario) return;
    try {
      await api.post('/garcons', formData);
      setFormData({ nome: '', data_admicao: '', salario: '' });
      setIsModalOpen(false);
      fetchGarcons();
    } catch(err) {
      alert('Erro ao cadastrar funcionário.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Certeza que deseja remover este garçom do quadro?")) return;
    try {
      await api.delete(`/garcons/${id}`);
      fetchGarcons();
    } catch(err) {
      alert('Erro ao excluir garçom. Verifique se ele possui comandas vinculadas.');
    }
  };

  // Funções Utilitárias para Paginação
  const handlePageChange = (newPage) => setCurrentPage(newPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  let garconsFiltrados = garcons;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    garconsFiltrados = garconsFiltrados.filter(g => g.nome.toLowerCase().includes(term));
  }

  const totalPages = Math.ceil(garconsFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGarcons = garconsFiltrados.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ margin: 0 }}>Quadro de Garçons</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={20} /> Cadastrar Garçom
        </button>
      </div>
      
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            <h2 className="mb-4" style={{ fontSize: '1.5rem', marginTop: '-0.5rem' }}>Adicionar Funcionário</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Patty" required />
              </div>
              <div className="grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Data de Admissão</label>
                  <input type="date" className="form-input" value={formData.data_admicao} onChange={e => setFormData({...formData, data_admicao: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Salário Base (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={formData.salario} onChange={e => setFormData({...formData, salario: e.target.value})} placeholder="3500.00" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%', padding: '1rem' }}>
                <UserPlus size={18} /> Cadastrar Garçom
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0" style={{ fontSize: '1.25rem' }}>Funcionários Cadastrados ({garconsFiltrados.length})</h2>
          <div className="flex items-center gap-2">
             <div className="flex items-center" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
               <Search size={18} className="text-muted ml-2" style={{marginLeft: '0.8rem'}}/>
               <input type="text" placeholder="Buscar por Nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input border-0 bg-transparent" style={{boxShadow: 'none'}} />
             </div>
          </div>
        </div>

        {loading ? <p>Carregando dados...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome do Garçom</th>
                  <th>Admissão</th>
                  <th>Salário Base</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGarcons.map(g => (
                  <tr key={g.Id_garcom}>
                    <td style={{ color: 'var(--text-muted)' }}>#{g.Id_garcom}</td>
                    <td><strong style={{ fontSize: '1.05rem' }}>{g.nome}</strong></td>
                    <td>
                      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                        <CalendarDays size={14} />
                        {new Date(g.data_admicao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </div>
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        {Number(g.salario).toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <button onClick={() => handleDelete(g.Id_garcom)} className="btn btn-danger" style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedGarcons.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum garçom encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted">Apresentando {paginatedGarcons.length} resultados (Página {currentPage} de {totalPages})</span>
                <div className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{padding: '0.5rem'}}><ChevronLeft size={16}/></button>
                  <button className="btn btn-outline" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{padding: '0.5rem'}}><ChevronRight size={16}/></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
