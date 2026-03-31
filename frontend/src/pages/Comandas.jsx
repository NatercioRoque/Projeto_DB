import { useEffect, useState } from 'react';
import axios from 'axios';
import { ReceiptText, Trash2, PlusCircle, Calendar, X, Edit, CreditCard, ShoppingCart, Search, ChevronLeft, ChevronRight, User, CheckCircle, List } from 'lucide-react';
import AutocompleteSelect from '../components/AutocompleteSelect';
const api = axios.create({ baseURL: 'http://localhost:3000/api' });

export default function Comandas() {
  const [comandas, setComandas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cardapio, setCardapio] = useState([]);
  const [garcons, setGarcons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAproveModalOpen, setIsAproveModalOpen] = useState(false);

  // Paginação e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTarget, setSearchTarget] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Payload states
  const [agindoEm, setAgindoEm] = useState(null); // id da comanda selecionada
  // New/Edit form
  const [mesa, setMesa] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [idGarcom, setIdGarcom] = useState('');
  const [itensSelecionados, setItensSelecionados] = useState([]); // array de ids do cardapio
  // Checkout
  const [formaPagamento, setFormaPagamento] = useState('Credito');

  const fetchDados = async () => {
    try {
      const [resComandas, resClientes, resCardapio, resGarcons] = await Promise.all([
        api.get('/comandas'),
        api.get('/clientes'),
        api.get('/cardapio'),
        api.get('/garcons')
      ]);
      setComandas(resComandas.data);
      setClientes(resClientes.data);
      setCardapio(resCardapio.data);
      setGarcons(resGarcons.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDados() }, []);

  const clearForm = () => {
    setMesa(''); setClienteId(''); setIdGarcom(''); setItensSelecionados([]); setAgindoEm(null);
  };

  // Funçoes de Criação
  const handleAddItem = (itemId) => {
    if (!itemId) return;
    setItensSelecionados([...itensSelecionados, parseInt(itemId)]);
  };
  const handleRemoveItem = (index) => {
    const list = [...itensSelecionados];
    list.splice(index, 1);
    setItensSelecionados(list);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!mesa || !clienteId || itensSelecionados.length === 0) {
      alert("Preencha todos os campos e adicione ao menos 1 item."); return;
    }
    try {
      await api.post('/comandas', {
        mesa: parseInt(mesa),
        clienteId: parseInt(clienteId),
        id_garcom: idGarcom ? parseInt(idGarcom) : undefined,
        itens: itensSelecionados
      });
      clearForm(); setIsNewModalOpen(false); fetchDados();
    } catch(err) { alert('Erro ao criar.'); }
  };

  // Funçoes de Edição
  const openEditModal = (comanda) => {
    setAgindoEm(comanda.id);
    setMesa(comanda.mesa);
    setClienteId(comanda.clienteId);
    setIdGarcom(comanda.id_garcom || '');
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/comandas/${agindoEm}/editar`, { mesa, clienteId, id_garcom: idGarcom || undefined });
      clearForm(); setIsEditModalOpen(false); fetchDados();
    } catch (err) { alert('Erro ao editar.'); }
  };

  // Funções de Gerenciar Pedidos
  const openEditItemsModal = (comanda) => {
    setAgindoEm(comanda);
    setItensSelecionados(comanda.itens ? [...comanda.itens] : []);
    setIsAddModalOpen(true);
  };

  const handleUpdateItems = async (e) => {
    e.preventDefault();
    if (itensSelecionados.length === 0) { alert('Adicione pelo menos um item.'); return; }
    try {
      await api.put(`/comandas/${agindoEm.id}/adicionar-item`, { novosItens: itensSelecionados });
      clearForm(); setIsAddModalOpen(false); fetchDados();
    } catch (err) { alert('Erro ao atualizar pedidos.'); }
  };

  // Aprovação
  const openAproveModal = (comanda) => {
    setAgindoEm(comanda);
    setIdGarcom('');
    setIsAproveModalOpen(true);
  };

  const handleAprove = async (e) => {
    e.preventDefault();
    if(!idGarcom) { alert('Escolha um garçom!'); return; }
    try {
      await api.put(`/comandas/${agindoEm.id}/aprovar`, { id_garcom: parseInt(idGarcom) });
      clearForm(); setIsAproveModalOpen(false); fetchDados();
    } catch(err) { alert('Erro ao aprovar.'); }
  };

  // Checkout
  const openCheckout = (comanda) => {
    setAgindoEm(comanda);
    setFormaPagamento('Crédito');
    setIsCheckoutModalOpen(true);
  }

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/comandas/${agindoEm.id}/finalizar`, { pagamento: formaPagamento });
      clearForm(); setIsCheckoutModalOpen(false); fetchDados();
    } catch(err) { alert('Erro ao fechar caixa.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Certeza que deseja remover a comanda do banco?")) return;
    try { await api.delete(`/comandas/${id}`); fetchDados(); } catch(err) { alert('Erro ao excluir.'); }
  };

  const calcSubtotal = (itemsIdArray) => {
    return itemsIdArray.reduce((total, id) => {
      const item = cardapio.find(c => c.id === id);
      return total + (item ? Number(item.valor) : 0);
    }, 0);
  };

  // Funções Utilitárias para Paginação
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Refresh page 1 on search change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, searchTarget]);

  // Tabelas
  const comandasAtivas = comandas.filter(c => !c.finalizada && c.status === 'ATIVA');
  const comandasPendentes = comandas.filter(c => !c.finalizada && c.status === 'PENDENTE');
  let comandasHistorico = comandas.filter(c => c.finalizada);

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    comandasHistorico = comandasHistorico.filter(c => {
      switch(searchTarget) {
        case 'Mesa': return String(c.mesa).includes(term);
        case 'Cliente': return c.cliente?.nome?.toLowerCase().includes(term);
        case 'Garçom': return c.garcom?.nome?.toLowerCase().includes(term);
        case 'Data': return new Date(c.data).toLocaleDateString('pt-BR').includes(term);
        default: 
          return String(c.mesa).includes(term) || 
                 c.cliente?.nome?.toLowerCase().includes(term) ||
                 c.garcom?.nome?.toLowerCase().includes(term) ||
                 new Date(c.data).toLocaleDateString('pt-BR').includes(term);
      }
    });
  }

  const totalPages = Math.ceil(comandasHistorico.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistorico = comandasHistorico.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 style={{ margin: 0 }}>Gestão de Comandas</h1>
        <button className="btn btn-primary" onClick={() => { clearForm(); setIsNewModalOpen(true); }}>
          <PlusCircle size={20} /> Abrir Comanda
        </button>
      </div>

      {/* MODAL 1: NOVA COMANDA */}
      {isNewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsNewModalOpen(false)}><X size={24} /></button>
            <h2 className="mb-4">Abrir Nova Comanda</h2>
            <form onSubmit={handleCreate}>
              <div className="grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Número da Mesa</label>
                  <input type="number" className="form-input" value={mesa} onChange={e => setMesa(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cliente Responsável</label>
                  <AutocompleteSelect
                    options={clientes}
                    value={clienteId}
                    onChange={setClienteId}
                    placeholder="Buscar nome do cliente..."
                    subLabelFn={(cli) => `CPF: ${cli.cpf}`}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Garçom</label>
                  <AutocompleteSelect
                    options={garcons}
                    value={idGarcom}
                    onChange={setIdGarcom}
                    keyFn={(g) => g.Id_garcom}
                    placeholder="Buscar garçom (ou vazio p/ balcão)..."
                  />
                </div>
              </div>

              <div className="form-group my-4">
                <label className="form-label">Primeiro Pedido</label>
                <div className="flex gap-2">
                  <select id="itemSelect" className="form-input flex-1">
                    <option value="">Adicionar item...</option>
                    {cardapio.filter(c => c.disponivel).map(item => (
                      <option key={item.id} value={item.id}>{item.nome} - R$ {Number(item.valor).toFixed(2)}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-outline" onClick={() => {
                    const select = document.getElementById('itemSelect');
                    handleAddItem(select.value); select.value = '';
                  }}><PlusCircle size={18} /></button>
                </div>
              </div>

              <div className="list-container">
                {itensSelecionados.length === 0 ? <p className="text-muted text-center">Vazio.</p> : (
                  <ul>
                    {itensSelecionados.map((id, idx) => {
                      const obj = cardapio.find(c => c.id === id);
                      return (
                        <li key={idx} className="flex justify-between items-center mb-2">
                          <span>{obj?.nome}</span>
                          <button type="button" onClick={() => handleRemoveItem(idx)} className="text-danger bg-transparent border-0 cursor-pointer"><Trash2 size={16} /></button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-4 mt-2">
                <span>Subtotal:</span>
                <h3 className="text-primary m-0">R$ {calcSubtotal(itensSelecionados).toFixed(2)}</h3>
              </div>
              <button type="submit" className="btn btn-primary w-100"><ReceiptText size={18} /> Abrir Comanda</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR CABEÇALHO */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsEditModalOpen(false)}><X size={24} /></button>
            <h2 className="mb-4">Editar Dados da Mesa</h2>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label className="form-label">Número da Mesa</label>
                <input type="number" className="form-input" value={mesa} onChange={e => setMesa(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Alterar Cliente</label>
                <AutocompleteSelect
                  options={clientes}
                  value={clienteId}
                  onChange={setClienteId}
                  placeholder="Buscar nome do cliente..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Trocar Garçom</label>
                <AutocompleteSelect
                  options={garcons}
                  value={idGarcom}
                  onChange={setIdGarcom}
                  keyFn={(g) => g.Id_garcom}
                  placeholder="Buscar garçom (ou vazio p/ balcão)..."
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 mt-4"><Edit size={18} /> Salvar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GERENCIAR ITENS */}
      {isAddModalOpen && agindoEm && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAddModalOpen(false)}><X size={24} /></button>
            <h2 className="mb-4">Gerenciar Pedidos - Mesa {agindoEm.mesa}</h2>
            
            <div className="form-group mb-4">
              <label className="form-label">Adicionar ao Cardápio</label>
              <div className="flex gap-2">
                <select id="newItemSelect" className="form-input flex-1">
                  <option value="">Selecione a bebida ou comida...</option>
                  {cardapio.filter(c => c.disponivel).map(item => (
                    <option key={item.id} value={item.id}>{item.nome} - R$ {Number(item.valor).toFixed(2)}</option>
                  ))}
                </select>
                 <button type="button" className="btn btn-outline" onClick={() => {
                  const select = document.getElementById('newItemSelect');
                  handleAddItem(select.value); select.value = '';
                }}><PlusCircle size={18} /></button>
              </div>
            </div>

            <div className="list-container mb-4">
              <strong className="text-secondary d-block mb-2">Itens da Comanda:</strong>
              {itensSelecionados.length === 0 ? <p className="text-muted text-center" style={{fontSize: '0.85rem'}}>A comanda está vazia.</p> : (
                <ul className="m-0 p-0" style={{listStyle: 'none', maxHeight: '180px', overflowY: 'auto'}}>
                  {itensSelecionados.map((id, idx) => {
                    const obj = cardapio.find(c => c.id === id);
                    return (
                      <li key={idx} className="flex justify-between items-center mb-2 pb-1 border-bottom-dashed">
                        <span>{obj?.nome || 'Item Deletado'}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-primary font-bold">R$ {Number(obj?.valor||0).toFixed(2)}</span>
                           <button type="button" onClick={() => handleRemoveItem(idx)} className="text-danger bg-transparent border-0 cursor-pointer" title="Remover da Mesa"><Trash2 size={16} /></button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            
            <button type="button" onClick={handleUpdateItems} className="btn btn-primary w-100"><List size={18} /> Salvar Modificações</button>
          </div>
        </div>
      )}

      {/* MODAL 4: FINALIZAR (CHECKOUT) */}
      {isCheckoutModalOpen && agindoEm && (
        <div className="modal-overlay" onClick={() => setIsCheckoutModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsCheckoutModalOpen(false)}><X size={24} /></button>
            <div className="flex justify-between items-start mb-2">
              <h2 className="m-0 text-primary">Fechamento de Conta</h2>
              {agindoEm.cliente?.e_flamengo && agindoEm.cliente?.fa_OP && agindoEm.cliente?.souseano && (
                <span role="img" aria-label="Chapéu de Palha" title="Cliente Especial Baratie (1% Desconto)" style={{ fontSize: '1.8rem', cursor: 'help' }}>👒</span>
              )}
            </div>
            <p className="text-muted mb-4">Mesa {agindoEm.mesa} • Cliente {agindoEm.cliente?.nome}</p>
            
            <div className="list-container mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <strong>Extrato de Consumo:</strong>
              <ul className="m-0 mt-2 p-0" style={{listStyle: 'none'}}>
                  {agindoEm.itens.map((itemId, idx) => {
                    const obj = cardapio.find(c => c.id === itemId);
                    return (
                      <li key={idx} className="flex justify-between items-center mb-1 pb-1 border-bottom-dashed text-sm">
                        <span>{obj?.nome || 'Item Del.'}</span>
                        <span>R$ {Number(obj?.valor||0).toFixed(2)}</span>
                      </li>
                    );
                  })}
                  {agindoEm.cliente?.e_flamengo && agindoEm.cliente?.fa_OP && agindoEm.cliente?.souseano && (
                    <li className="flex justify-between items-center mt-2 pt-2 border-top-dashed text-sm" style={{ color: 'var(--info)', fontWeight: 'bold' }}>
                      <span>Desconto Especial VIP (1%)</span>
                      <span>- R$ {(Number(agindoEm.total) / 0.99 * 0.01).toFixed(2)}</span>
                    </li>
                  )}
              </ul>
            </div>

            <h1 className="text-center text-primary mb-4" style={{fontSize: '2.5rem'}}>
              R$ {Number(agindoEm.total).toFixed(2)}
            </h1>

            <form onSubmit={handleCheckout}>
              <div className="form-group mb-4">
                <label className="form-label">Forma de Pagamento</label>
                <select className="form-input" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                  <option value="Crédito">Crédito</option>
                  <option value="Débito">Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro (À Vista)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success w-100 py-3" style={{ fontSize: '1.1rem' }}>
                <CreditCard size={20} /> Receber e Finalizar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VISUALIZAR ITENS (HISTÓRICO) */}
      {isViewModalOpen && agindoEm && (
        <div className="modal-overlay" onClick={() => setIsViewModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsViewModalOpen(false)}><X size={24} /></button>
            <div className="flex justify-between items-start mb-2">
              <h2 className="m-0 text-primary">Consumo da Mesa {agindoEm.mesa}</h2>
              {agindoEm.cliente?.e_flamengo && agindoEm.cliente?.fa_OP && agindoEm.cliente?.souseano && (
                <span role="img" aria-label="Chapéu de Palha" title="Cliente Especial Baratie (1% Desconto)" style={{ fontSize: '1.8rem', cursor: 'help' }}>👒</span>
              )}
            </div>
            <p className="text-muted mb-4">Cliente: {agindoEm.cliente?.nome || '-'} • Garçom: {agindoEm.garcom?.nome || '-'}</p>
            
            <div className="list-container mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <ul className="m-0 mt-2 p-0" style={{listStyle: 'none'}}>
                  {agindoEm.itens.length === 0 ? <p className="text-muted text-sm my-4 text-center">Nenhum item registrado.</p> : agindoEm.itens.map((itemId, idx) => {
                    const obj = cardapio.find(c => c.id === itemId);
                    return (
                      <li key={idx} className="flex justify-between items-center mb-1 pb-1 border-bottom-dashed text-sm">
                        <span>{obj?.nome || 'Item Del.'}</span>
                        <span>R$ {Number(obj?.valor||0).toFixed(2)}</span>
                      </li>
                    );
                  })}
                  {agindoEm.cliente?.e_flamengo && agindoEm.cliente?.fa_OP && agindoEm.cliente?.souseano && (
                    <li className="flex justify-between items-center mt-2 pt-2 border-top-dashed text-sm" style={{ color: 'var(--info)', fontWeight: 'bold' }}>
                      <span>Desconto Especial VIP (1%)</span>
                      <span>- R$ {(Number(agindoEm.total) / 0.99 * 0.01).toFixed(2)}</span>
                    </li>
                  )}
              </ul>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--surface-glass-border)' }}>
               <h3 className="m-0 text-muted">Apurado Final</h3>
               <h3 className="m-0 text-success">R$ {Number(agindoEm.total).toFixed(2)}</h3>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: APROVAR PEDIDO */}
      {isAproveModalOpen && agindoEm && (
        <div className="modal-overlay" onClick={() => setIsAproveModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsAproveModalOpen(false)}><X size={24} /></button>
            <h2 className="mb-4 text-info">Aprovar Pedido Mesa {agindoEm.mesa}</h2>
            
            <div className="list-container mb-4 px-3 py-2" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-glass-border)', borderRadius: 'var(--radius-sm)' }}>
              <strong className="text-secondary d-block mb-2">Resumo da Sacola do Cliente:</strong>
              <ul className="m-0 p-0" style={{listStyle: 'none', maxHeight: '150px', overflowY: 'auto'}}>
                  {agindoEm.itens.length === 0 ? <p className="text-muted text-sm my-2 text-center">Nenhum item.</p> : agindoEm.itens.map((itemId, idx) => {
                    const obj = cardapio.find(c => c.id === itemId);
                    return (
                      <li key={idx} className="flex justify-between items-center mb-1 pb-1 border-bottom-dashed text-sm">
                        <span>{obj?.nome || 'Item Deletado'}</span>
                        <span className="text-primary font-bold">R$ {Number(obj?.valor||0).toFixed(2)}</span>
                      </li>
                    );
                  })}
              </ul>
              <div className="flex justify-between items-center mt-3 pt-2 text-sm" style={{ borderTop: '1px dashed var(--surface-glass-border)' }}>
                 <strong className="text-muted">Valor Parcial Projetado:</strong>
                 <strong className="text-success">R$ {Number(agindoEm.total).toFixed(2)}</strong>
              </div>
            </div>

            <p className="text-secondary mb-4 text-sm">Designe um garçom responsável para confirmar a produção desta comanda.</p>
            <form onSubmit={handleAprove}>
               <div className="form-group">
                 <label className="form-label">Garçom Atendente</label>
                 <AutocompleteSelect
                   options={garcons}
                   value={idGarcom}
                   onChange={setIdGarcom}
                   keyFn={(g) => g.Id_garcom}
                   placeholder="Buscar garçom por nome..."
                 />
               </div>
               <button type="submit" className="btn btn-primary w-100 py-3 mt-4" style={{fontSize: '1.1rem'}}>
                 <CheckCircle size={20} /> Confirmar & Abrir Mesa
               </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: PEDIDOS A CONFIRMAR */}
      <div className="glass-card mb-8" style={{ border: '2px dashed var(--info)' }}>
        <h2 className="mb-4 text-info">Pedidos a Confirmar (Autoatendimento)</h2>
        {loading ? <p>Carregando...</p> : (
          <div className="grid-3 gap-4">
            {comandasPendentes.length === 0 && <p className="text-muted col-span-full">Nenhum pedido pendente na fila.</p>}
            {comandasPendentes.map(com => (
              <div key={com.id} className="glass-card p-4" style={{ background: 'rgba(56, 189, 248, 0.05)' }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-info m-0" style={{ fontSize: '1.5rem'}}>Mesa {com.mesa}</h3>
                  <div className="flex gap-2 items-center">
                    <span className="badge badge-info">{com.itens.length} itens</span>
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <span className="text-sm font-bold text-success">R$ {Number(com.total).toFixed(2)}</span>
                  <button onClick={() => openAproveModal(com)} className="btn btn-primary d-flex items-center gap-1 p-2">
                     <CheckCircle size={16}/> Revisar & Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW: COMANDAS ATIVAS */}
      <div className="glass-card mb-8">
        <h2 className="mb-4 text-warning">Comandas Ativas (Mesas Abertas)</h2>
        {loading ? <p>Carregando...</p> : (
          <div className="grid-3 gap-4">
            {comandasAtivas.length === 0 && <p className="text-muted col-span-full">Nenhuma mesa aberta no salão.</p>}
            {comandasAtivas.map(com => (
              <div key={com.id} className="glass-card p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-primary m-0" style={{ fontSize: '1.5rem'}}>Mesa {com.mesa}</h3>
                  <div className="flex gap-2 items-center">
                    {com.cliente?.e_flamengo && com.cliente?.fa_OP && com.cliente?.souseano && (
                      <span role="img" aria-label="Chapéu de Palha" title="Desconto Baratie de 1% Aplicado" style={{ fontSize: '1.5rem', cursor: 'help' }}>👒</span>
                    )}
                    <span className="badge badge-warning">{com.itens.length} itens</span>
                  </div>
                </div>
                <p className="text-sm text-secondary m-0 mb-1">C: <strong>{com.cliente?.nome}</strong></p>
                <p className="text-sm text-muted m-0 mb-4">G: {com.garcom?.nome || 'Balcão'}</p>
                
                <h2 className="m-0 mb-4">R$ {Number(com.total).toFixed(2)}</h2>

                <div className="flex flex-col gap-2">
                   <div className="grid-2 gap-2">
                     <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={() => openEditModal(com)} title="Editar"><Edit size={16}/></button>
                     <button className="btn btn-outline" style={{padding: '0.4rem'}} onClick={() => openEditItemsModal(com)} title="Gerenciar Pedidos"><List size={16}/></button>
                   </div>
                   <button className="btn btn-success" onClick={() => openCheckout(com)}><CreditCard size={18}/> Checkout</button>
                   <button className="btn btn-danger" onClick={() => handleDelete(com.id)} style={{padding: '0.4rem', marginTop: '0.5rem'}}><Trash2 size={16}/> Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW: HISTÓRICO FECHADO */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0">Histórico de Caixas Fechados</h2>
          <div className="flex items-center gap-2">
             <select className="form-input" style={{padding: '0.5rem'}} value={searchTarget} onChange={e => setSearchTarget(e.target.value)}>
               <option value="Todas">Todas as Colunas</option>
               <option value="Mesa">Mesa</option>
               <option value="Cliente">Cliente</option>
               <option value="Garçom">Garçom</option>
               <option value="Data">Data</option>
             </select>
             <div className="flex items-center" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
               <Search size={18} className="text-muted ml-2" style={{marginLeft: '0.8rem'}}/>
               <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input border-0 bg-transparent" style={{boxShadow: 'none'}} />
             </div>
          </div>
        </div>

        {loading ? <p>Carregando histórico...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Fechamento</th>
                  <th>Cliente</th>
                  <th>Garçom</th>
                  <th>Pagamento</th>
                  <th>Qtd</th>
                  <th>Total Faturado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistorico.map(com => (
                  <tr key={com.id}>
                    <td><strong className="text-primary">#{com.mesa}</strong></td>
                    <td><div className="flex items-center gap-2 text-muted"><Calendar size={14} />{new Date(com.data).toLocaleString('pt-BR')}</div></td>
                    <td><strong>{com.cliente?.nome || '-'}</strong></td>
                    <td><div className="flex items-center gap-1"><User size={14} className="text-muted"/>{com.garcom?.nome || 'N/A'}</div></td>
                    <td><span className="badge badge-success">{com.pagamento || 'N/A'}</span></td>
                    <td>
                      <span className="badge badge-info cursor-pointer hover:opacity-80 transition-opacity" title="Aperte para visualizar itens" onClick={() => { setAgindoEm(com); setIsViewModalOpen(true); }} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem'}}>
                        {com.itens.length} Consumos
                      </span>
                    </td>
                    <td className="text-success" style={{fontWeight: 'bold'}}>R$ {Number(com.total).toFixed(2)}</td>
                    <td><button onClick={() => handleDelete(com.id)} className="btn btn-danger p-2"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
                {paginatedHistorico.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-8 text-muted">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted">Exibindo {paginatedHistorico.length} registros (Página {currentPage} de {totalPages})</span>
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
