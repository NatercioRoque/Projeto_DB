import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Edit, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nome: '', cpf: '', telefone: '', e_flamengo: false, fa_OP: false, souseano: false });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Paginação e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientes() }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.cpf) return;
    try {
      if (editId) {
        await api.put(`/clientes/${editId}`, formData);
      } else {
        await api.post('/clientes', formData);
      }
      setFormData({ nome: '', cpf: '', telefone: '', e_flamengo: false, fa_OP: false, souseano: false });
      setEditId(null);
      setIsModalOpen(false);
      fetchClientes();
    } catch(err) {
      alert(editId ? 'Erro ao atualizar cliente.' : 'Erro ao criar cliente.');
    }
  };

  const handleEdit = (cliente) => {
    setFormData({
      nome: cliente.nome,
      cpf: cliente.cpf,
      telefone: cliente.telefone,
      e_flamengo: cliente.e_flamengo || false,
      fa_OP: cliente.fa_OP || false,
      souseano: cliente.souseano || false
    });
    setEditId(cliente.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Certeza que deseja remover este cliente?")) return;
    try {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
    } catch(err) {
      alert('Erro ao excluir.');
    }
  };

  // Funções Utilitárias para Paginação
  const handlePageChange = (newPage) => setCurrentPage(newPage);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  let clientesFiltrados = clientes;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    clientesFiltrados = clientesFiltrados.filter(c => c.nome.toLowerCase().includes(term));
  }

  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClientes = clientesFiltrados.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ margin: 0 }}>Gerenciar Clientes</h1>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setFormData({ nome: '', cpf: '', telefone: '', e_flamengo: false, fa_OP: false, souseano: false }); setIsModalOpen(true); }}>
          <UserPlus size={20} /> Cadastrar Cliente
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>
            <h2 className="mb-4" style={{ fontSize: '1.5rem', marginTop: '-0.5rem' }}>{editId ? 'Editar Dados do Cliente' : 'Adicionar Novo Cliente'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Sanji Vinsmoke" required />
              </div>
              <div className="form-group">
                <label className="form-label">CPF</label>
                <input type="text" className="form-input" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} placeholder="Apenas números" required />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input type="text" className="form-input" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="Apenas números" />
              </div>
              <div className="form-group mt-4">
                <label className="form-label mb-2 d-block">Características Especiais</label>
                <div className="flex flex-col gap-2 p-3" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)'}}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={formData.e_flamengo} onChange={e => setFormData({...formData, e_flamengo: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span>É torcedor do Flamengo.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={formData.fa_OP} onChange={e => setFormData({...formData, fa_OP: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span>É fã de One Piece.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={formData.souseano} onChange={e => setFormData({...formData, souseano: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                    <span>É de Sousa.</span>
                  </label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%', padding: '1rem' }}>
                <UserPlus size={18} /> {editId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0" style={{ fontSize: '1.25rem' }}>Lista de Clientes ({clientesFiltrados.length})</h2>
          <div className="flex items-center gap-2">
             <div className="flex items-center" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
               <Search size={18} className="text-muted ml-2" style={{marginLeft: '0.8rem'}}/>
               <input type="text" placeholder="Buscar por Nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input border-0 bg-transparent" style={{boxShadow: 'none'}} />
             </div>
          </div>
        </div>

        {loading ? <p>Carregando clientes...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Telefone</th>
                  <th>Comandas</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClientes.map(cli => (
                  <tr key={cli.id}>
                    <td>#{cli.id}</td>
                    <td><strong>{cli.nome}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{cli.cpf}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{cli.telefone || 'N/A'}</td>
                    <td>
                      <span className="badge badge-info">{cli.comandas?.length || 0}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(cli)} className="btn btn-outline" style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(cli.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedClientes.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted">Apresentando {paginatedClientes.length} resultados (Página {currentPage} de {totalPages})</span>
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
