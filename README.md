# API de Controle de Estoque

## Objetivo do projeto

Esta API foi desenvolvida para facilitar o controle de produtos e movimentações de estoque em um ambiente simples e eficiente. Ela permite:

- cadastrar produtos;
- listar produtos cadastrados;
- atualizar informações de produtos;
- remover produtos;
- registrar movimentos de estoque, como entradas e saídas.

A aplicação é construída em Node.js com Express e utiliza PostgreSQL como banco de dados.

## Tecnologias utilizadas

- Node.js
- Express
- PostgreSQL
- dotenv
- Vitest + Supertest (testes)

## Requisitos

Antes de rodar o projeto, certifique-se de ter instalado:

- Node.js (versão recomendada: 18+)
- npm
- PostgreSQL

## Configuração do ambiente local

### 1. Instale as dependências

No diretório do projeto, execute:

```bash
npm install
```

### 2. Crie um arquivo .env

Na raiz do projeto, crie um arquivo chamado .env com as seguintes variáveis:

```env
DB_USER=seu_usuario
DB_HOST=localhost
DB_NAME=nome_do_banco
DB_PASSWORD=sua_senha
DB_PORT=5432
API_KEYS=minha-chave,outra-chave
```

A variável API_KEYS define as chaves permitidas para acessar a API. A aplicação espera que o cliente envie a chave no header `x-api-key`.

### 3. Crie o banco de dados e as tabelas

Antes de iniciar a API, o PostgreSQL precisa estar rodando e o banco configurado.

Exemplo de criação das tabelas necessárias:

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  reason VARCHAR(255),
  date_movement TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Como rodar a aplicação

Inicie o servidor com:

```bash
node server.js
```

O servidor ficará disponível em:

```text
http://localhost:3000
```

## Autenticação

Todas as rotas da API exigem um header chamado `x-api-key`.

Exemplo:

```bash
curl -H "x-api-key: minha-chave" http://localhost:3000/products
```

## Testes

Para rodar os testes automatizados:

```bash
npm test
```
