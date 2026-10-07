# Biblioteca do NEABI Tia Ciata

Extensão do site oficial do NEABI Tia Ciata da UTFPR Cornélio Procópio para publicar artigos, ensaios, relatos e resenhas escritos por estudantes. O projeto integra uma interface pública de produções estudantis a uma API REST construída com Node.js, Express, PostgreSQL/Sequelize e MongoDB/Mongoose.

## Integrante

- Marcelo da Silva Junior — RA 2707039

## Objetivos atendidos

- Node.js e Express
- Rotas GET, POST, PUT/PATCH e DELETE
- PostgreSQL com Sequelize
- MongoDB com Mongoose
- Três entidades relacionais e dois relacionamentos 1:N
- CRUD relacional e CRUD documental
- Consultas com busca, filtros, ordenação, paginação e agregação
- Objetos e arrays aninhados no MongoDB
- Validação de dados nos dois ORMs
- Controllers orientados a objetos e reutilização por herança
- Tratamento centralizado de erros e arquivo de log
- Integração dos dois bancos na mesma temática e na mesma API
- Interface responsiva integrada à identidade do site oficial
- Seed idempotente e testes automatizados

## Integração com o site oficial

A interface foi alinhada ao [repositório do site-mãe](https://github.com/marcelolukas/NEABI-UTFPR-Cornelio-Procopio-Site-Oficial): reutiliza o logotipo oficial, a fonte Inter, a organização do cabeçalho e as cores institucionais encontradas no projeto.

| Uso | Cor |
|---|---|
| Vermelho institucional | `#A92824` |
| Vermelho do cabeçalho | `#B22222` |
| Vermelho escuro | `#7D1718` |
| Verde institucional | `#0F6B37` |
| Verde escuro | `#094A26` |
| Verde de destaque | `#278F54` |
| Dourado | `#E0BB4F` |
| Creme e papel | `#F7EDCF` e `#FFFAF0` |

A navegação da biblioteca mantém os mesmos destinos do site-mãe. Configure `SITE_MAE_URL` com a URL pública do site oficial para gerar esses links automaticamente. Enquanto a variável estiver vazia, o repositório oficial é usado como referência segura.

## Decisão de modelagem

### PostgreSQL e Sequelize

O PostgreSQL armazena os dados estruturais do acervo, que exigem integridade referencial e relacionamentos estáveis.

```text
Categoria (1) ──────── (N) Artigo (N) ──────── (1) Participante
    id                    categoriaId                 id
    nome                  autorId                     nome
    slug                  título                      email
                          conteúdo                    papel
```

| Entidade | Campos principais | Regras |
|---|---|---|
| `Categoria` | `id`, `nome`, `slug`, `descricao`, `cor` | Nome e slug únicos; cor hexadecimal |
| `Participante` | `id`, `nome`, `email`, `papel`, `bio`, `ativo` | E-mail único; papel limitado aos valores do domínio |
| `Artigo` | `id`, `titulo`, `slug`, `resumo`, `conteudo`, `formato`, `tempoLeitura`, `publicado`, `categoriaId`, `autorId` | Categoria e autor obrigatórios; slug único; formato validado |

Relacionamentos:

- Uma categoria possui muitos artigos; cada artigo pertence a uma categoria.
- Um participante pode ser autor de muitos artigos; cada artigo possui um autor.
- As chaves estrangeiras usam atualização em cascata e impedem a exclusão de categoria ou autor ainda referenciado.

### MongoDB e Mongoose

O MongoDB armazena dados que crescem de forma dinâmica ou possuem estrutura flexível:

- `Comentario`: relaciona-se logicamente a `Artigo.id`, contém autor, texto, reações e um array de respostas aninhadas.
- `Interacao`: registra visualizações, salvamentos, compartilhamentos e buscas, permitindo detalhes variáveis conforme o evento.

Exemplo de comentário:

```json
{
  "artigoId": 1,
  "autor": { "nome": "Leitora", "email": "leitora@example.com" },
  "texto": "Este percurso ajudou na preparação da aula.",
  "respostas": [
    {
      "autor": { "nome": "Equipe NEABI" },
      "texto": "Novas referências serão adicionadas ao percurso.",
      "criadoEm": "2026-10-07T12:00:00.000Z"
    }
  ],
  "reacoes": { "apoio": 2, "reflexao": 1 },
  "status": "publicado"
}
```

### Por que utilizar os dois bancos?

Categorias, participantes e artigos possuem schema previsível e dependem de relações consistentes, por isso ficam no PostgreSQL. Comentários e interações podem crescer rapidamente, receber campos contextuais e conter estruturas aninhadas, características adequadas ao MongoDB.

Os sistemas não são independentes: `Comentario.artigoId` e `Interacao.artigoId` apontam para `Artigo.id`. Antes de criar esses documentos, a aplicação confirma no PostgreSQL que o artigo existe. A rota `GET /api/artigos/:id/completo` reúne o artigo relacional e seus comentários documentais em uma única resposta.

## Arquitetura

```text
biblioteca-neabi/
├── app.js                       # Express, saúde e inicialização dos bancos
├── config/
│   ├── loadEnv.js               # Carrega variáveis do arquivo .env
│   ├── db_sequelize.js          # Conexão PostgreSQL
│   └── db_mongoose.js           # Conexão MongoDB
├── models/                      # Models Sequelize e schemas Mongoose
├── controllers/
│   ├── RelationalCrudController.js
│   ├── DocumentCrudController.js
│   └── ...                      # Controllers especializados
├── routes/                      # Rotas REST separadas por recurso
├── middlewares/                 # Erros, 404 e handlers assíncronos
├── utils/                       # Logger, HttpError e slug
├── scripts/seed.js              # Carga inicial dos dois bancos
├── public/                      # Extensão visual do site oficial
│   └── assets/                  # Logotipo institucional
├── test/                        # Testes HTTP e dos models
└── logs/errors.log              # Erros em JSON por linha
```

`RelationalCrudController` e `DocumentCrudController` são classes base. Os controllers especializados herdam ou configuram essas classes, demonstrando encapsulamento, reutilização e especialização com JavaScript orientado a objetos.

## Pré-requisitos

- Node.js 20.19 ou superior
- PostgreSQL 14 ou superior
- MongoDB 6 ou superior

> O requisito do Node acompanha o motor declarado pelo Mongoose 9 utilizado no projeto.

## Instalação

1. Instale as dependências:

```bash
npm install
```

Em uma máquina limpa, também é possível usar `npm ci` para instalar exatamente as versões registradas no `package-lock.json`.

2. Crie o banco PostgreSQL:

```sql
CREATE DATABASE biblioteca_neabi;
```

3. Copie o arquivo de ambiente:

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

4. Ajuste `.env` com as credenciais locais:

```env
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=biblioteca_neabi
PG_USER=postgres
PG_PASSWORD=postgres
MONGO_URI=mongodb://127.0.0.1:27017/biblioteca_neabi
SITE_MAE_URL=https://endereco-publicado-do-site-oficial.example
```

5. Com PostgreSQL e MongoDB em execução, crie as tabelas e carregue os dados de demonstração:

```bash
npm run db:seed
```

O seed pode ser executado novamente: categorias, autorias estudantis, artigos, comentário e interação são localizados antes da criação para evitar duplicações.

6. Inicie a aplicação:

```bash
npm start
```

Acesse:

- Interface: `http://localhost:3000`
- Índice da API: `http://localhost:3000/api`
- Saúde dos bancos: `http://localhost:3000/api/health`

Durante o desenvolvimento:

```bash
npm run dev
```

Por padrão a interface ainda inicia se um banco estiver indisponível, e `/api/health` retorna `degraded`. Para impedir a inicialização sem os dois bancos, defina `REQUIRE_DATABASES=true`.

## Bibliotecas utilizadas

Todas as dependências da aplicação estão ligadas diretamente aos requisitos do projeto:

| Biblioteca | Onde é usada | Por que é usada |
|---|---|---|
| `express` | `app.js` e `routes/` | Servidor HTTP, middlewares e rotas REST |
| `sequelize` | `models/`, `controllers/` e `config/db_sequelize.js` | Models, relacionamentos, validações e consultas no PostgreSQL |
| `pg` | Conexão utilizada pelo Sequelize | Driver de comunicação com o PostgreSQL |
| `mongoose` | Models documentais, controllers e `config/db_mongoose.js` | Schemas, validações e operações no MongoDB |
| `nodemon` | Comando `npm run dev` | Reinicia o servidor somente durante o desenvolvimento |

O frontend usa JavaScript, HTML e CSS sem frameworks adicionais.

## Rotas da API

### PostgreSQL

| Método | Rota | Operação |
|---|---|---|
| GET | `/api/config` | Informa a URL configurada do site-mãe |
| GET | `/api/categorias` | Lista categorias; aceita `q`, `ordenar`, `direcao`, `limit`, `offset` |
| POST | `/api/categorias` | Cria categoria |
| GET | `/api/categorias/:id` | Consulta categoria e seus artigos |
| PUT/PATCH | `/api/categorias/:id` | Atualiza categoria |
| DELETE | `/api/categorias/:id` | Exclui categoria sem artigos vinculados |
| GET | `/api/participantes` | Lista participantes |
| POST | `/api/participantes` | Cria participante |
| GET | `/api/participantes/:id` | Consulta participante e seus artigos |
| PUT/PATCH | `/api/participantes/:id` | Atualiza participante |
| DELETE | `/api/participantes/:id` | Exclui participante sem artigos vinculados |
| GET | `/api/artigos` | Busca e filtra artigos |
| POST | `/api/artigos` | Cria artigo |
| GET | `/api/artigos/:id` | Consulta artigo, categoria e autor |
| GET | `/api/artigos/:id/completo` | Reúne artigo PostgreSQL e comentários MongoDB |
| PUT/PATCH | `/api/artigos/:id` | Atualiza artigo |
| DELETE | `/api/artigos/:id` | Exclui artigo e limpa seus documentos MongoDB |

Filtros de artigos:

```text
GET /api/artigos?q=educacao&categoriaId=3&formato=guia&publicado=true&ordenar=titulo&direcao=ASC
```

### MongoDB

| Método | Rota | Operação |
|---|---|---|
| GET | `/api/comentarios?artigoId=1&status=publicado` | Lista e filtra comentários |
| POST | `/api/comentarios` | Cria comentário após validar o artigo no PostgreSQL |
| GET | `/api/comentarios/:id` | Consulta comentário |
| PUT/PATCH | `/api/comentarios/:id` | Atualiza comentário |
| DELETE | `/api/comentarios/:id` | Exclui comentário |
| POST | `/api/comentarios/:id/respostas` | Adiciona resposta aninhada |
| POST | `/api/comentarios/:id/reacoes` | Incrementa `apoio` ou `reflexao` |
| GET | `/api/interacoes` | Lista eventos por artigo, participante ou tipo |
| POST | `/api/interacoes` | Registra interação após validar referências no PostgreSQL |
| GET | `/api/interacoes/:id` | Consulta interação |
| PUT/PATCH | `/api/interacoes/:id` | Atualiza interação |
| DELETE | `/api/interacoes/:id` | Exclui interação |
| GET | `/api/interacoes/resumo` | Agrega totais por tipo de interação |

## Exemplos de requisição

Criar uma categoria:

```http
POST /api/categorias
Content-Type: application/json

{
  "nome": "Direitos e cidadania",
  "descricao": "Legislação, direitos coletivos e políticas públicas.",
  "cor": "#2E5D72"
}
```

Criar um participante:

```http
POST /api/participantes
Content-Type: application/json

{
  "nome": "Ana Souza",
  "email": "ana@example.com",
  "papel": "estudante",
  "bio": "Estudante e autora de produções sobre educação e relações étnico-raciais."
}
```

Criar um artigo:

```http
POST /api/artigos
Content-Type: application/json

{
  "titulo": "Práticas de leitura construídas pela turma",
  "resumo": "Um ensaio estudantil com referências e reflexões desenvolvidas em sala.",
  "conteudo": "Conteúdo completo do artigo com no mínimo vinte caracteres.",
  "formato": "guia",
  "tempoLeitura": 8,
  "categoriaId": 1,
  "autorId": 1
}
```

Criar um comentário:

```http
POST /api/comentarios
Content-Type: application/json

{
  "artigoId": 1,
  "autor": { "nome": "Carlos", "email": "carlos@example.com" },
  "texto": "O material contribuiu para a atividade da turma."
}
```

Registrar uma interação:

```http
POST /api/interacoes
Content-Type: application/json

{
  "artigoId": 1,
  "participanteId": 1,
  "sessaoId": "sessao-demonstracao",
  "tipo": "salvamento",
  "detalhes": { "lista": "leituras para aula" },
  "contexto": { "origem": "pagina do acervo", "dispositivo": "desktop" }
}
```

## Validação e tratamento de erros

- Sequelize valida obrigatoriedade, tamanho, e-mail, valores permitidos, unicidade e chaves estrangeiras.
- Mongoose valida documentos, subdocumentos, arrays, enums e limites numéricos.
- Identificadores e filtros são verificados pelos controllers.
- Erros assíncronos chegam a um middleware único e retornam JSON consistente.
- Erros `400`, `404`, `409`, `422`, `500` e `503` são diferenciados.
- Cada erro é registrado em `logs/errors.log` como JSON contendo data, rota, método, status e stack.

Formato de erro:

```json
{
  "erro": {
    "mensagem": "Os dados enviados são inválidos.",
    "detalhes": [
      { "campo": "email", "mensagem": "Informe um e-mail válido." }
    ]
  }
}
```

## Testes

```bash
npm test
```

Para executar em um único comando as verificações de sintaxe e a suíte automatizada:

```bash
npm run check
```

A suíte usa `node:test` e cobre:

- entrega da interface e recursos estáticos;
- índice e saúde da API;
- associações do Sequelize;
- geração de slug e validações relacionais;
- documento MongoDB com resposta aninhada;
- rejeição de enum inválido no Mongoose.

Os testes de model não precisam de bancos ativos. Para demonstrar CRUDs persistidos, execute os dois bancos, rode o seed e utilize os exemplos de API.

## Checklist para entrega

Antes de gerar o arquivo final:

1. Confirme o nome e o RA apresentados na seção **Integrante**.
2. Instale as dependências em uma máquina limpa com `npm ci`.
3. Crie o PostgreSQL, inicie PostgreSQL e MongoDB e configure o arquivo `.env`.
4. Execute `npm run db:seed`.
5. Execute `npm run check` e confirme que todos os testes passam.
6. Execute `npm start` e abra `http://localhost:3000/api/health`.
7. Confirme que a saúde retorna `"status": "ok"` e os dois bancos aparecem como `connected`.
8. Demonstre pelo menos um POST, GET, PATCH e DELETE relacional e documental com os exemplos deste README.
9. Confira a interface, a busca, os filtros, a lista de leitura e os links do cabeçalho.
10. Compacte a pasta sem `node_modules`, sem o arquivo `.env` e sem outros arquivos locais ou pacotes antigos.
11. Abra o ZIP gerado e confirme que `package.json`, `package-lock.json`, `.env.example`, `README.md`, código-fonte e ativos estão presentes.

Não envie credenciais reais. O arquivo `.env.example` documenta as variáveis necessárias sem expor senhas.

## Roteiro sugerido para apresentação

1. Mostrar a interface e filtrar o acervo.
2. Abrir `/api/health` e comprovar os dois bancos conectados.
3. Explicar o diagrama relacional e as chaves estrangeiras.
4. Criar e consultar uma categoria, participante e artigo.
5. Filtrar artigos com `req.query`.
6. Criar um comentário e adicionar uma resposta aninhada.
7. Abrir `/api/artigos/:id/completo` para demonstrar a integração.
8. Registrar interações e mostrar `/api/interacoes/resumo`.
9. Enviar um payload inválido e mostrar a resposta e `logs/errors.log`.
10. Executar `npm test`.
