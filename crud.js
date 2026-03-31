const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());
app.use(express.json());

// --- ROTAS DE CLIENTES ---

app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: { comandas: true }
    });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, cpf, telefone, e_flamengo, fa_OP, souseano } = req.body;
    const cliente = await prisma.cliente.create({
      data: { 
        nome, 
        cpf, 
        telefone,
        e_flamengo: e_flamengo || false,
        fa_OP: fa_OP || false,
        souseano: souseano || false
      }
    });
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.cliente.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// --- ROTAS DO CARDÁPIO & BEBIDAS ---

app.get('/api/cardapio', async (req, res) => {
  try {
    const itens = await prisma.cardapio.findMany({
      include: { bebida: true },
      orderBy: { nome: 'asc' }
    });
    res.json(itens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cardapio', async (req, res) => {
  try {
    const { nome, valor, categoria, disponivel, tipoBebida, safra } = req.body;
    
    // Primeiro cria o item de cardápio geral
    const cardapioItem = await prisma.cardapio.create({
      data: {
        nome,
        valor: parseFloat(valor),
        categoria,
        disponivel: disponivel !== undefined ? disponivel : true
      }
    });

    // Se for bebida, cria o ref associado
    if (categoria === 'Bebida') {
      await prisma.bebida.create({
        data: {
          id: cardapioItem.id,
          tipo: tipoBebida || 'Outro',
          safra: safra ? parseInt(safra) : null
        }
      });
    }

    // Busca completo pra retornar
    const itemCompleto = await prisma.cardapio.findUnique({
      where: { id: cardapioItem.id },
      include: { bebida: true }
    });

    res.status(201).json(itemCompleto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/cardapio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, valor, categoria, disponivel, tipoBebida, safra } = req.body;

    const updatedItem = await prisma.cardapio.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        valor: valor ? parseFloat(valor) : undefined,
        categoria,
        disponivel
      }
    });

    if (categoria === 'Bebida' || tipoBebida) {
      // Upsert na bebida para garantir que se for alterado pra bebida ele ajusta
      await prisma.bebida.upsert({
        where: { id: parseInt(id) },
        update: {
          tipo: tipoBebida,
          safra: safra ? parseInt(safra) : null
        },
        create: {
          id: parseInt(id),
          tipo: tipoBebida || 'Outro',
          safra: safra ? parseInt(safra) : null
        }
      });
    }

    const itemCompleto = await prisma.cardapio.findUnique({
      where: { id: parseInt(id) },
      include: { bebida: true }
    });

    res.json(itemCompleto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/cardapio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // O Prisma normalmente apaga as relações se tiver onDelete: Cascade,
    // mas por garantia tentamos deletar Bebida primeiro
    try { await prisma.bebida.delete({ where: { id: parseInt(id) } }); } catch(err){}
    
    await prisma.cardapio.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// --- ROTAS DE GARÇONS ---

app.get('/api/garcons', async (req, res) => {
  try {
    const garcons = await prisma.garcom.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(garcons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/garcons', async (req, res) => {
  try {
    const { nome, data_admicao, salario } = req.body;
    const garcom = await prisma.garcom.create({
      data: {
        nome,
        data_admicao: new Date(data_admicao),
        salario: parseFloat(salario)
      }
    });
    res.status(201).json(garcom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/garcons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, data_admicao, salario } = req.body;
    const data = {};
    if (nome) data.nome = nome;
    if (data_admicao) data.data_admicao = new Date(data_admicao);
    if (salario) data.salario = parseFloat(salario);

    const garcom = await prisma.garcom.update({
      where: { Id_garcom: parseInt(id) },
      data
    });
    res.json(garcom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/garcons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.garcom.delete({ where: { Id_garcom: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// --- ROTAS DAS COMANDAS ---

app.get('/api/comandas', async (req, res) => {
  try {
    const comandas = await prisma.comanda.findMany({
      include: { cliente: true, garcom: true },
      orderBy: { data: 'desc' }
    });
    res.json(comandas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/comandas', async (req, res) => {
  try {
    const { mesa, clienteId, id_garcom, itens, data, status } = req.body;

    if (!itens || itens.length === 0) {
      return res.status(400).json({ error: "Comanda deve conter itens." });
    }

    // Calcular total com base nos IDs passados
    const itensBanco = await prisma.cardapio.findMany({
      where: { id: { in: itens } }
    });
    
    let total = 0;
    itensBanco.forEach(i => total += Number(i.valor));

    // Regra de Desconto 1%
    const clienteAtual = await prisma.cliente.findUnique({ where: { id: parseInt(clienteId) }});
    if (clienteAtual && clienteAtual.e_flamengo && clienteAtual.fa_OP && clienteAtual.souseano) {
      total = total * 0.99;
    }

    const comandaData = {
      mesa: parseInt(mesa),
      clienteId: parseInt(clienteId),
      itens,
      total,
      status: status || 'ATIVA'
    };
    
    if (id_garcom) {
      comandaData.id_garcom = parseInt(id_garcom);
    }
    
    if (data) comandaData.data = new Date(data);

    const comanda = await prisma.comanda.create({
      data: comandaData
    });
    res.status(201).json(comanda);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Aprovar Comanda Pendente
app.put('/api/comandas/:id/aprovar', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_garcom } = req.body;
    if (!id_garcom) throw new Error("É necessário designar um garçom para aprovar o pedido.");

    const comanda = await prisma.comanda.update({
      where: { id: parseInt(id) },
      data: {
        id_garcom: parseInt(id_garcom),
        status: 'ATIVA'
      }
    });
    res.json(comanda);
  } catch(error) {
    res.status(400).json({ error: error.message });
  }
});

// Editar Cabeçalho (Mesa, Cliente, Garçom)
app.put('/api/comandas/:id/editar', async (req, res) => {
  try {
    const { id } = req.params;
    const { mesa, clienteId, id_garcom } = req.body;
    
    const data = {};
    if (mesa) data.mesa = parseInt(mesa);
    if (clienteId) data.clienteId = parseInt(clienteId);
    if (id_garcom) data.id_garcom = parseInt(id_garcom);

    const comanda = await prisma.comanda.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(comanda);
  } catch(error) {
    res.status(400).json({ error: error.message });
  }
});

// Atualizar Itens (Adicionar ou Remover)
app.put('/api/comandas/:id/adicionar-item', async (req, res) => {
  try {
    const { id } = req.params;
    const { novosItens } = req.body; // array de IDs de cardapio re-enviado completo

    // Puxar comanda atual
    const comandaAtual = await prisma.comanda.findUnique({
      where: { id: parseInt(id) },
      include: { cliente: true }
    });

    if(!comandaAtual) throw new Error("Comanda não encontrada.");

    // Se não mandou nada, zera a array.
    const arrayFinal = novosItens || [];

    // Recalcular novo total
    const itensBanco = await prisma.cardapio.findMany({
      where: { id: { in: arrayFinal } }
    });

    let total = 0;
    // Soma todos considerando possíveis repetidos usando o arrayFinal como base de contagem
    arrayFinal.forEach(itemId => {
       const prod = itensBanco.find(i => i.id === itemId);
       if (prod) total += Number(prod.valor);
    });

    // Regra de Desconto 1%
    const cli = comandaAtual.cliente;
    if (cli && cli.e_flamengo && cli.fa_OP && cli.souseano) {
       total = total * 0.99;
    }

    const comandaAtualizada = await prisma.comanda.update({
      where: { id: parseInt(id) },
      data: {
        itens: arrayFinal,
        total
      }
    });

    res.json(comandaAtualizada);
  } catch(error) {
    res.status(400).json({ error: error.message });
  }
});

// Finalizar Comanda
app.put('/api/comandas/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    const { pagamento } = req.body;

    const comanda = await prisma.comanda.update({
      where: { id: parseInt(id) },
      data: {
        finalizada: true,
        pagamento
      }
    });
    res.json(comanda);
  } catch(error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/comandas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.comanda.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rolando na porta ${PORT}`);
});
