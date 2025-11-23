# Security plan (estado atual e próximos passos)

- **Problema atual:** autenticação, papéis (incluindo admin), senhas, tokens de reset e dados de visitas vivem no `localStorage` do navegador. Qualquer pessoa com DevTools altera/perfil falsifica dados; não há isolamento nem persistência confiável.
- **Objetivo:** mover autenticação e dados para o servidor (route handlers do Next), garantindo armazenamento seguro, sessões reais e auditoria.

## Arquitetura com o próprio servidor do Next
- **Persistência**: usar o server runtime do Next para acessar um banco (ideal: Postgres com Prisma). Enquanto não houver DB, usar storage de arquivo (`data/*.json`) apenas para desenvolvimento, com bloqueio de escrita e validação de esquema.
- **Criptografia**: hash de senha no servidor com `bcrypt` (sal + cost adequado).
- **Sessão**: cookie httpOnly, `SameSite=Lax`, `Secure` em produção. Sessão curta (ex.: 2h) e refresh opcional.
- **Autorização**: middleware server-side verificando cookie e papel antes de atender endpoints/rotas de admin.
- **Reset de senha**: tokens de uso único salvos no servidor (tabela/arquivo), expirando em 20 min, invalidados após uso. E-mail enviado via route handler `POST /api/auth/reset/request` e verificação em `POST /api/auth/reset/confirm`.
- **Rate-limit**: limitar tentativas por IP+email em login e reset (ex.: 5/min). Em dev, usar um in-memory map; em prod, Redis.
- **Auditoria**: registrar quem criou/alterou visita, quem cancelou inscrição e quando (campos `createdBy`, `updatedAt`, `cancelledAt`, `cancelledBy`, `cancelReason`).

## Esqueleto de endpoints (route handlers)
- `POST /api/auth/register` – recebe nome, email, telefone, senha; cria usuário, hash de senha.
- `POST /api/auth/login` – valida senha, cria sessão e cookie.
- `POST /api/auth/logout` – invalida sessão/limpa cookie.
- `POST /api/auth/reset/request` – gera token e envia email.
- `POST /api/auth/reset/confirm` – troca senha se token válido.
- `GET /api/me` – retorna usuário logado a partir do cookie.
- `GET /api/visitas` – lista visitas (pública).
- `POST /api/visitas` – cria visita (admin).
- `PATCH /api/visitas/:id` – edita ou cancela visita (admin).
- `DELETE /api/visitas/:id` – exclui visita (admin).
- `POST /api/visitas/:id/inscricoes` – inscrever usuário logado.
- `POST /api/visitas/:id/cancelar-inscricao` – cancelar com motivo.

## Migração incremental sugerida
1) **Infra base**: adicionar Prisma + Postgres (ou storage de arquivo provisório) e modelos `User`, `Session`, `ResetToken`, `Visita`, `Inscricao`, `Cancelamento`.
2) **Autenticação server-side**: criar rotas `register/login/logout/me`, mover o form de login/registro para consumir estas rotas e remover dependência de `localStorage` para usuário.
3) **Visitas server-side**: criar rotas de CRUD e inscrição, trocar `VisitasContext` para buscar dados da API e usar SWR/React Query para cache client.
4) **Remoção do legado**: apagar funções de auth/visitas do `utils/localStorage.ts` e quaisquer chamadas residuais.
5) **Hardening**: adicionar rate-limit, validação de entrada (Zod/Yup), cookies `Secure`, e logs de auditoria.
6) **Testes**: e2e com Playwright para fluxos de login, criação de visita, inscrição, cancelamento; testes de API unitários para auth/reset.
