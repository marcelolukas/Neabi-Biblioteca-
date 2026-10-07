const { connectPostgres, disconnectPostgres } = require('../config/db_sequelize');
const { connectMongo, disconnectMongo } = require('../config/db_mongoose');
const { Categoria, Participante, Artigo } = require('../models');
const Comentario = require('../models/Comentario');
const Interacao = require('../models/Interacao');

const categoriasIniciais = [
  { nome: 'Afro-brasilidade', slug: 'afro-brasilidade', descricao: 'História, cultura e produção intelectual afro-brasileira.', cor: '#A92824' },
  { nome: 'Povos indígenas', slug: 'povos-indigenas', descricao: 'Autoria, territórios, saberes e direitos dos povos indígenas.', cor: '#E0BB4F' },
  { nome: 'Educação', slug: 'educacao', descricao: 'Materiais para práticas pedagógicas e relações étnico-raciais.', cor: '#0F6B37' },
  { nome: 'Memória', slug: 'memoria', descricao: 'Acervos, territórios e narrativas de memória coletiva.', cor: '#7D1718' },
  { nome: 'Literatura', slug: 'literatura', descricao: 'Percursos de leitura e autorias contemporâneas.', cor: '#278F54' },
];

const autoresIniciais = [
  { nome: 'Coletivo de estudantes do NEABI', email: 'coletivo@biblioteca-neabi.example', papel: 'estudante', bio: 'Produção coletiva de estudantes vinculados às ações do NEABI Tia Ciata.' },
  { nome: 'Grupo de leitura e extensão', email: 'grupo-leitura@biblioteca-neabi.example', papel: 'estudante', bio: 'Grupo estudantil dedicado a leituras, debates e ações de extensão.' },
  { nome: 'Turma de estudos afro-brasileiros', email: 'turma-estudos@biblioteca-neabi.example', papel: 'estudante', bio: 'Estudantes reunidos em atividades de estudo sobre história e cultura afro-brasileira.' },
  { nome: 'Caderno de leituras estudantis', email: 'caderno-leituras@biblioteca-neabi.example', papel: 'estudante', bio: 'Autoria coletiva de resenhas, ensaios e registros de leitura.' },
  { nome: 'Estudantes das licenciaturas', email: 'licenciaturas@biblioteca-neabi.example', papel: 'estudante', bio: 'Produções elaboradas por estudantes das licenciaturas da UTFPR.' },
  { nome: 'Oficina de práticas pedagógicas', email: 'oficina-pedagogica@biblioteca-neabi.example', papel: 'estudante', bio: 'Grupo de estudantes que transforma pesquisa em propostas pedagógicas.' },
];

const artigosIniciais = [
  {
    titulo: 'Educação antirracista começa no cotidiano',
    slug: 'educacao-antirracista-comeca-no-cotidiano',
    resumo: 'Um ponto de partida para rever referências, escutar a comunidade escolar e transformar escolhas pedagógicas cotidianas.',
    conteudo: 'A educação antirracista é uma prática contínua. Ela começa pela revisão do repertório, pela escuta da comunidade e pelo planejamento de ações que atravessem todo o currículo.',
    formato: 'artigo', tempoLeitura: 8, categoria: 'educacao', autorEmail: 'coletivo@biblioteca-neabi.example',
  },
  {
    titulo: 'Literaturas indígenas: autoria, território e presente',
    slug: 'literaturas-indigenas-autoria-territorio-presente',
    resumo: 'Obras e questões para conhecer autorias indígenas contemporâneas para além de uma visão fixada no passado.',
    conteudo: 'As literaturas indígenas contemporâneas articulam memória, território, língua e presente. Este percurso reúne perguntas para uma leitura atenta às autorias e aos contextos de produção.',
    formato: 'artigo', tempoLeitura: 10, categoria: 'povos-indigenas', autorEmail: 'grupo-leitura@biblioteca-neabi.example',
  },
  {
    titulo: 'Quilombos: memória, território e resistência',
    slug: 'quilombos-memoria-territorio-resistencia',
    resumo: 'Conceitos e fontes para compreender comunidades quilombolas como territórios vivos de memória e produção de futuro.',
    conteudo: 'Quilombos são territórios de continuidade histórica, organização coletiva e construção de futuro. O dossiê apresenta conceitos e caminhos para aprofundar a pesquisa.',
    formato: 'dossie', tempoLeitura: 12, categoria: 'memoria', autorEmail: 'turma-estudos@biblioteca-neabi.example',
  },
  {
    titulo: 'Mulheres negras e a escrita de si',
    slug: 'mulheres-negras-escrita-de-si',
    resumo: 'Uma seleção para observar como memória, linguagem e experiência redesenham a tradição literária brasileira.',
    conteudo: 'A escrita de mulheres negras desloca perspectivas e amplia a tradição literária. Esta seleção propõe uma aproximação entre memória, experiência e linguagem.',
    formato: 'artigo', tempoLeitura: 9, categoria: 'literatura', autorEmail: 'caderno-leituras@biblioteca-neabi.example',
  },
  {
    titulo: 'Saberes ancestrais e ciência: onde as conversas começam',
    slug: 'saberes-ancestrais-e-ciencia',
    resumo: 'Questões para trabalhar diferentes modos de produzir conhecimento sem hierarquizar experiências e perspectivas.',
    conteudo: 'Diferentes sistemas de conhecimento podem conversar sem que um seja reduzido ao outro. O material oferece questões para uma abordagem responsável em pesquisa e ensino.',
    formato: 'artigo', tempoLeitura: 7, categoria: 'povos-indigenas', autorEmail: 'licenciaturas@biblioteca-neabi.example',
  },
  {
    titulo: 'Lei 10.639/03: caminhos construídos em sala de aula',
    slug: 'lei-10639-caminhos-construidos-sala-de-aula',
    resumo: 'Referências iniciais para transformar uma obrigação curricular em prática pedagógica contínua e contextualizada.',
    conteudo: 'A Lei 10.639/03 orienta uma transformação curricular que não se limita a datas comemorativas. Este material apresenta caminhos para planejamento, repertório e avaliação.',
    formato: 'material', tempoLeitura: 6, categoria: 'educacao', autorEmail: 'oficina-pedagogica@biblioteca-neabi.example',
  },
];

async function seed() {
  await Promise.all([connectPostgres({ sync: true }), connectMongo()]);

  const categorias = {};
  for (const data of categoriasIniciais) {
    const [categoria, created] = await Categoria.findOrCreate({ where: { slug: data.slug }, defaults: data });
    if (!created) await categoria.update(data);
    categorias[data.slug] = categoria;
  }

  const autores = {};
  for (const data of autoresIniciais) {
    const [autor, created] = await Participante.findOrCreate({ where: { email: data.email }, defaults: data });
    if (!created) await autor.update(data);
    autores[data.email] = autor;
  }

  const artigos = [];
  for (const data of artigosIniciais) {
    const { categoria: categoriaSlug, autorEmail, ...fields } = data;
    const articleData = {
      ...fields,
      categoriaId: categorias[categoriaSlug].id,
      autorId: autores[autorEmail].id,
    };
    const [artigo, created] = await Artigo.findOrCreate({
      where: { slug: fields.slug },
      defaults: articleData,
    });
    if (!created) await artigo.update(articleData);
    artigos.push(artigo);
  }

  const primeiroArtigo = artigos[0];
  if (!await Comentario.exists({ artigoId: primeiroArtigo.id })) {
    await Comentario.create({
      artigoId: primeiroArtigo.id,
      autor: { nome: 'Visitante do acervo' },
      texto: 'Este percurso ajuda a transformar o tema em prática cotidiana.',
      respostas: [{ autor: { nome: 'Equipe NEABI' }, texto: 'Que bom saber! O acervo continuará recebendo novas referências.' }],
    });
  }

  if (!await Interacao.exists({ artigoId: primeiroArtigo.id, sessaoId: 'seed-demonstracao' })) {
    await Interacao.create({
      artigoId: primeiroArtigo.id,
      sessaoId: 'seed-demonstracao',
      tipo: 'visualizacao',
      detalhes: { origem: 'carga inicial' },
      contexto: { origem: 'seed', dispositivo: 'servidor' },
    });
  }

  console.log(`Carga concluída: ${Object.keys(categorias).length} categorias, ${artigos.length} artigos e ${Object.keys(autores).length} autorias estudantis.`);
}

seed()
  .catch((error) => {
    console.error('Falha ao executar a carga inicial:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([disconnectPostgres(), disconnectMongo()]);
  });
