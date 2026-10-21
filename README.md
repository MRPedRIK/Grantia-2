# Grantia — patrimônio e chamados (Angular)
Sistema mobile-first/PWA com **Angular 20 standalone + TypeScript + Tailwind CSS**, câmera QR/barcode (html5-qrcode), API Node/Express, PostgreSQL e Docker Compose. Interface em português.

## Iniciar no Windows
Instale Git, VS Code e Docker Desktop. No PowerShell:

```powershell
git clone https://github.com/MRPedRIK/Grantia-2.git
cd Grantia-2
code .
.\iniciar.ps1
```

O script cria um arquivo local `.env` com senhas aleatórias (somente na primeira execução), exibe a senha inicial do administrador e inicia o Docker. **Anote a senha que aparece na primeira execução.** Depois acesse **http://localhost:8080** e entre como **admin@local**.

## Usar
1. Entre como administrador e cadastre técnicos/usuários.
2. Cadastre equipamentos com número de patrimônio, modelo e localização.
3. Busque pelo número ou leia QR/código de barras com a câmera.
4. Registre defeito e envio à sede: abre chamado e grava movimento.
5. Receba na sede e atribua um técnico.
6. Técnico registra reparo, responsável pela retirada e entrega.
7. Confirme recebimento de volta: chamado encerrado e histórico preservado.

## Proxmox
Clone o repositório numa **VM Linux com Docker Engine + Docker Compose** e configure segredos no `.env` (use `.env.example` como referência). Execute `docker compose up -d --build`. O PostgreSQL persiste no volume `pgdata`; **não use `docker compose down -v`** sem backup. Uma atualização de frontend pode ser aplicada com `git pull && docker compose up -d --build`.

**A câmera no celular requer HTTPS válido**, mesmo na rede local (exceto localhost). Use proxy reverso com TLS/HTTPS para acessar a aplicação via telefone. Hospedagem, domínio e HTTPS não são provisionados automaticamente.

## Desenvolvimento
- Frontend: `cd frontend && npm install && npm run dev` (Node 22.12+); proxy de /api para localhost:3000.
- Compilar: `cd frontend && npm run build`. Saída: `frontend/dist/grantia/browser`.
- Validar tipos: `cd frontend && npm run typecheck`.
- Backend: `cd backend && npm install && npm test`; `npm start` precisa PostgreSQL configurado.
- API: `GET /api/assets/:patrimony`, `POST /api/assets/movement`, `POST /api/assets`, `POST /api/login`, `GET/POST /api/users`.
- O `database/init.sql` é aplicado somente na criação do volume de banco.

**Segurança**: não publique `.env`. JWT é armazenado na sessão do navegador, não offline. Os registros usam transações no backend, controle de versão e logs de auditoria. Antes de uso institucional, configure HTTPS, backups, política de acesso a inventário e recuperação de senhas.

## Estrutura
- `frontend/src/app/`: Angular, tela principal, scanner, fluxo e serviços
- `frontend/angular.json`: configuração Angular CLI
- `frontend/src/styles.css`: Tailwind CSS
- `frontend/public/`: PWA, manifest e cache do shell
- `backend/`: API e validações
- `database/init.sql`: tabelas e índices
- `docker-compose.yml`: banco, backend e frontend
- `iniciar.ps1`: inicializador Windows
