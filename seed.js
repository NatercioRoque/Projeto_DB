const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearDB() {
  console.log('\nLimpando tabelas do banco de dados...');
  // Apagar tabelas dependentes primeiro
  await prisma.bebida.deleteMany({});
  await prisma.comanda.deleteMany({});
  // Apagar tabelas independentes depois
  await prisma.cardapio.deleteMany({});
  await prisma.cliente.deleteMany({});
  console.log('✅ Tabelas limpas com sucesso!');
}

async function main() {
  await clearDB();

  console.log('\nInserindo clientes...');
  const clientesData = [
    { nome: 'João Pedro Silva', cpf: '12345678901', telefone: '11987654321' },
    { nome: 'Maria Oliveira', cpf: '23456789012', telefone: '21998765432' },
    { nome: 'Carlos Souza', cpf: '34567890123', telefone: '31912345678' },
    { nome: 'Ana Costa', cpf: '45678901234', telefone: '41923456789' },
    { nome: 'Luiz Fernando', cpf: '56789012345', telefone: '51934567890' },
    { nome: 'Juliana Mendes', cpf: '67890123456', telefone: '61945678901' },
    { nome: 'Rafael Carvalho', cpf: '78901234567', telefone: '71956789012' },
    { nome: 'Camila Rocha', cpf: '89012345678', telefone: '81967890123' },
    { nome: 'Bruno Lima', cpf: '90123456789', telefone: '91978901234' },
    { nome: 'Amanda Ribeiro', cpf: '01234567890', telefone: '11989012345' },
    { nome: 'Felipe Martins', cpf: '09876543210', telefone: '21976543210' },
    { nome: 'Beatriz Almeida', cpf: '98765432109', telefone: '31965432109' },
    { nome: 'Ricardo Neves', cpf: '87654321098', telefone: '41954321098' },
    { nome: 'Patrícia Gomes', cpf: '76543210987', telefone: '51943210987' },
    { nome: 'Marcelo Pereira', cpf: '65432109876', telefone: '61932109876' }
  ];

  const clientesCriados = [];
  for (const c of clientesData) {
    const cliente = await prisma.cliente.create({ data: c });
    clientesCriados.push(cliente);
  }
  console.log(`✅ ${clientesCriados.length} clientes inseridos.`);

  console.log('\nInserindo itens no cardápio/bebidas...');
  
  // 10 Vinhos
  const vinhosData = [
    { nome: 'Vinho Tinto Cabernet Sauvignon', valor: 95.00, safra: 2019 },
    { nome: 'Vinho Branco Chardonnay', valor: 85.00, safra: 2021 },
    { nome: 'Vinho Rosé Provence', valor: 110.00, safra: 2022 },
    { nome: 'Vinho Tinto Merlot', valor: 90.00, safra: 2020 },
    { nome: 'Vinho Tinto Malbec', valor: 120.00, safra: 2018 },
    { nome: 'Vinho Branco Sauvignon Blanc', valor: 80.00, safra: 2023 },
    { nome: 'Vinho Tinto Pinot Noir', valor: 130.00, safra: 2021 },
    { nome: 'Espumante Brut', valor: 150.00, safra: null },
    { nome: 'Vinho Tinto Carménère', valor: 105.00, safra: 2020 },
    { nome: 'Vinho do Porto Tawny', valor: 160.00, safra: null }
  ];

  // 10 Outras Bebidas
  const outrosBebidasData = [
    { nome: 'Refrigerante Cola 350ml', valor: 8.00, tipo: 'Refrigerante' },
    { nome: 'Refrigerante Guaraná 350ml', valor: 8.00, tipo: 'Refrigerante' },
    { nome: 'Suco Natural de Laranja', valor: 12.00, tipo: 'Suco' },
    { nome: 'Suco Natural de Limão', valor: 12.00, tipo: 'Suco' },
    { nome: 'Água Mineral com Gás', valor: 6.00, tipo: 'Água' },
    { nome: 'Água Mineral sem Gás', valor: 6.00, tipo: 'Água' },
    { nome: 'Cerveja Pilsen 600ml', valor: 18.00, tipo: 'Cerveja' },
    { nome: 'Cerveja IPA 500ml', valor: 25.00, tipo: 'Cerveja' },
    { nome: 'Chopp Pilsen 300ml', valor: 14.00, tipo: 'Cerveja' },
    { nome: 'Limonada Suíça', valor: 15.00, tipo: 'Suco' }
  ];

  const pratosPrincipaisData = [
    { nome: 'Filé Mignon ao Molho Madeira', valor: 85.90, categoria: 'Prato Principal' },
    { nome: 'Salmão Grelhado com Legumes', valor: 79.50, categoria: 'Prato Principal' },
    { nome: 'Risoto de Funghi', valor: 65.00, categoria: 'Prato Principal' },
    { nome: 'Spaghetti à Carbonara', valor: 55.00, categoria: 'Prato Principal' },
    { nome: 'Peito de Frango Recheado', valor: 48.00, categoria: 'Prato Principal' }
  ];

  const sobremesasData = [
    { nome: 'Pudim de Leite Condensado', valor: 18.00, categoria: 'Sobremesa' },
    { nome: 'Petit Gâteau', valor: 28.00, categoria: 'Sobremesa' },
    { nome: 'Cheesecake de Frutas Vermelhas', valor: 25.00, categoria: 'Sobremesa' },
    { nome: 'Tiramisu', valor: 26.00, categoria: 'Sobremesa' },
    { nome: 'Sorvete Artesanal (2 Bolas)', valor: 20.00, categoria: 'Sobremesa' }
  ];

  const acompanhamentosData = [
    { nome: 'Porção de Fritas', valor: 25.00, categoria: 'Acompanhamento' },
    { nome: 'Salada da Casa', valor: 22.00, categoria: 'Acompanhamento' },
    { nome: 'Arroz Branco', valor: 12.00, categoria: 'Acompanhamento' },
    { nome: 'Purê de Batatas', valor: 18.00, categoria: 'Acompanhamento' },
    { nome: 'Farofa de Bacon', valor: 15.00, categoria: 'Acompanhamento' }
  ];

  const cardapioCriado = [];

  // Inserindo Vinhos
  for (const v of vinhosData) {
    const p = await prisma.cardapio.create({
      data: { nome: v.nome, valor: v.valor, categoria: 'Bebida', disponivel: true }
    });
    await prisma.bebida.create({
      data: { id: p.id, tipo: 'Vinho', safra: v.safra }
    });
    cardapioCriado.push(p);
  }

  // Inserindo Outras bebidas
  for (const b of outrosBebidasData) {
    const p = await prisma.cardapio.create({
      data: { nome: b.nome, valor: b.valor, categoria: 'Bebida', disponivel: true }
    });
    await prisma.bebida.create({
      data: { id: p.id, tipo: b.tipo, safra: null }
    });
    cardapioCriado.push(p);
  }

  // Inserindo Comidas
  const comidas = [...pratosPrincipaisData, ...sobremesasData, ...acompanhamentosData];
  for (const c of comidas) {
    const p = await prisma.cardapio.create({
      data: { nome: c.nome, valor: c.valor, categoria: c.categoria, disponivel: true }
    });
    cardapioCriado.push(p);
  }
  
  console.log(`✅ ${cardapioCriado.length} itens do cardapio inseridos (sendo 20 bebidas).`);

  console.log('\nInserindo comandas...');
  
  // Criar 35 comandas, cada cliente de 0 a 14 receberá garantidamente as comandas i
  const numeroTotalDeComandas = 35; 
  
  const agora = new Date();
  const noventaDiasAtras = new Date();
  noventaDiasAtras.setDate(agora.getDate() - 90);

  function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  const comandasCriadas = [];

  for (let i = 0; i < numeroTotalDeComandas; i++) {
    // Garantir que todos os 15 clientes recebam pelo menos 1 comanda
    const idxClienteSelecionado = i < clientesCriados.length 
      ? i 
      : Math.floor(Math.random() * clientesCriados.length);
    const clienteId = clientesCriados[idxClienteSelecionado].id;
    
    // De 1 a 5 itens aleatórios por comanda
    const qtdItens = Math.floor(Math.random() * 5) + 1;
    const itensIds = [];
    let totalComanda = 0;
    
    for (let j = 0; j < qtdItens; j++) {
      const randomItem = cardapioCriado[Math.floor(Math.random() * cardapioCriado.length)];
      itensIds.push(randomItem.id);
      totalComanda += Number(randomItem.valor);
    }
    
    const dataComanda = randomDate(noventaDiasAtras, agora);
    const mesa = Math.floor(Math.random() * 20) + 1; // Mesas de 1 a 20

    const comanda = await prisma.comanda.create({
      data: {
        mesa,
        data: dataComanda,
        clienteId,
        itens: itensIds,
        total: totalComanda
      }
    });

    comandasCriadas.push(comanda);
  }

  console.log(`✅ ${comandasCriadas.length} comandas inseridas com sucesso.\n`);
  console.log('🏁 Banco de dados populado com sucesso!');
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
