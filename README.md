# Grantia — controle de patrimônio e suporte

Aplicação em português, mobile-first, com React, Vite, Tailwind CSS, câmera QR/código de barras, Node.js/Express e PostgreSQL. Pronta para execução em Docker numa VM Linux do Proxmox.

## Início rápido no Windows

Depois de clonar e abrir a pasta, abra o Docker Desktop e execute no terminal PowerShell:

```powershell
.\\iniciar.ps1
```

O script gera as senhas automaticamente na primeira execução, mostra a senha do administrador e inicia os serviços. Se sua política bloquear scripts, use os passos manuais abaixo.

## 1. Abrir no VS Code

Instale Git, VS Code e Docker (Docker Desktop no Windows). No terminal:

```powershell
git clone https://github.com/MRPedRIK/Grantia-2.git
cd Grantia-2
code .
Copy-Item .env.example .env
```

No Linux, use `cp .env.example .env`. Edite o arquivo .env:
- POSTGRES_PASSWORD: escolha uma senha longa para o banco.
- JWT_SECRET: segredo aleatório de pelo menos 32 caracteres.
- ADMIN_PASSWORD: sua senha inicial, com pelo menos 12 caracteres.
- PORT: porta local, padrão 8080.

Não deixe os valores começando com "troque-". Nunca publique o .env.
Você pode gerar segredos com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## 2. Iniciar

```sh
docker compose up -d --build
docker compose ps
```

Abra http://localhost:8080. Login: **admin@local**. Senha: ADMIN_PASSWORD do .env.
A senha inicial é usada apenas na primeira criação do administrador; alterar o .env depois não muda a senha armazenada.

## 3. Usar

1. Cadastre as pessoas (técnicos e usuários) e os equipamentos.
2. Consulte um patrimônio digitando o número ou lendo a etiqueta pela câmera.
3. Envie à sede, descrevendo o defeito: abre chamado e muda para em trânsito.
4. O suporte confirma recebimento e atribui um técnico.
5. O técnico responsável registra reparo, quem retirou e quem entregará.
6. Confirme a entrega na unidade original: encerra chamado e libera o equipamento.
7. Consulte os chamados e o histórico com horários e responsáveis.

Os códigos devem conter o número exato do patrimônio, por exemplo RP113355. O sistema não importa automaticamente inventário de outro sistema. Não há dados reais ou senhas pré-definidas no repositório.

## 4. Proxmox e câmera no celular

Prefira uma VM Linux com Docker Engine e Compose. Copie/clonе o projeto, configure .env e execute o mesmo comando de inicialização.
O banco usa volume persistente e não expõe porta externa. Frontend e API usam a mesma origem via Nginx.

**No celular, a câmera e a instalação PWA precisam de HTTPS válido.** Coloque um proxy reverso com certificado confiável na frente da porta 8080. HTTP pelo IP da rede permite digitação manual, mas normalmente bloqueia a câmera. HTTPS e DNS dependem do seu servidor e domínio e não são configurados automaticamente por este projeto.
Permita câmera no navegador. A instalação na tela inicial varia por navegador.

O cache mantém a interface pública visitada; consultas, login e movimentações exigem conexão. Ações não são enfileiradas offline.

## Estrutura

- docker-compose.yml: banco, API e frontend
- database/init.sql: usuários, patrimônio, chamados e histórico
- backend/server.js: login, autorização, API e transações
- backend/db.js: conexão PostgreSQL
- backend/workflow.js: estados e permissões
- frontend/src/Scanner.jsx: leitura da câmera
- frontend/src/AssetWorkflow.jsx: ações e histórico
- frontend/src/App.jsx: login, cadastro e consulta
- frontend/public: manifest, ícone e service worker

## API

Todas as rotas, exceto login e health, usam `Authorization: Bearer TOKEN`.

| Método | Rota | Uso |
|---|---|---|
| POST | /api/login | email, password; retorna token |
| GET | /api/health | Saúde do banco |
| GET | /api/assets/:patrimony | Equipamento, chamados e histórico |
| POST | /api/assets | Cadastro de equipamento (suporte) |
| POST | /api/assets/movement | Movimentação |
| GET | /api/users | Técnicos disponíveis |
| POST | /api/users | Cadastro de pessoa (admin) |

Exemplo de movimentação:
```json
{"patrimony_number":"RP113355","version":0,"action":"send","notes":"Não liga"}
```

Ações: send, receive, assign, return, delivered. assign exige assigned_tech_id; return exige collector, deliverer e notes. version vem da consulta. Em conflito 409, consulte novamente.
Identidade do responsável é obtida do token, nunca do formulário. A transação bloqueia o equipamento e grava alteração e histórico juntos.

## Desenvolvimento e testes

Requer Node.js 22.12+ (Docker usa Node 24).

```sh
cd backend
npm install
npm test
cd ../frontend
npm install
npm run build
```

Para desenvolvimento separado, exponha um PostgreSQL local, aplique database/init.sql e configure PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, JWT_SECRET e ADMIN_PASSWORD no ambiente do backend. Rode npm start na API e npm run dev no frontend. O Vite encaminha /api para localhost:3000.

## Operação

```sh
docker compose logs --tail=100
docker compose down
```

`down` preserva o volume. Não use `down -v` sem backup: apaga o banco.
O SQL inicial roda somente em volume novo. Futuras mudanças de estrutura precisam de migrações.
Faça backups periódicos com pg_dump e teste restauração. Em uso institucional, adapte escopo de acesso por unidade, recuperação de senha e políticas de retenção conforme sua organização. Usuários autenticados desta versão podem consultar qualquer patrimônio e registrar envio/entrega; suporte recebe/atribui e administrador gerencia cadastros.

Publicar no GitHub disponibiliza o código. Hospedagem e HTTPS exigem executar a aplicação no servidor.
