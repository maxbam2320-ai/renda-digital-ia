# Renda Digital IA

Crie um micro SaaS chamado Renda Digital IA.

O produto é uma plataforma exclusiva para clientes que já compraram o acesso externamente.

IMPORTANTE: não criar planos, assinaturas, checkout, preços, upgrade ou área de pagamento dentro do SaaS.

O cliente já comprou antes de entrar na plataforma e deve receber acesso às funcionalidades após fazer login.

1. OBJETIVO

O Renda Digital IA ajuda pessoas que querem criar uma renda extra utilizando marketing digital.

A principal dor é:

"Quero ganhar uma renda extra online, mas não sei por onde começar, o que fazer ou qual estratégia seguir."

A solução é transformar as informações do usuário em:

Objetivo → Estratégia → Ações → Conteúdo → Oferta → Vendas → Progresso

A plataforma deve funcionar como um assistente pessoal de marketing digital.

2. FLUXO PRINCIPAL

O fluxo deve ser extremamente simples:

Cliente compra o produto externamente

↓

Acessa o SaaS

↓

Login com Google ou Apple

↓

Primeiro acesso: onboarding

↓

IA analisa o perfil

↓

Dashboard personalizado

↓

Ferramentas de IA

↓

Execução e acompanhamento

Não criar nenhuma etapa de pagamento dentro do aplicativo.

3. DESIGN

Criar uma interface:

Minimalista

Premium

Moderna

Clean

Profissional

Rápida

Intuitiva

Inspirar-se na simplicidade visual de produtos como:

Linear

Notion

Stripe

OpenAI

Usar principalmente:

Branco

Preto/grafite

Cinza

Uma cor de destaque discreta, como azul ou roxo

Evitar excesso de elementos, gradientes exagerados, animações pesadas e informações desnecessárias.

Priorizar muito espaço em branco, tipografia elegante, cards simples e excelente hierarquia visual.

4. LOGIN

O login deve possuir SOMENTE:

Continuar com Google

Continuar com Apple

Não criar login com:

E-mail e senha

Usuário e senha

Facebook

Outros provedores

Utilizar Supabase Auth.

O login precisa funcionar realmente, não apenas visualmente.

5. CONTA DO CLIENTE

Ao entrar pela primeira vez, criar automaticamente o perfil do cliente.

Salvar:

Nome

E-mail

Foto de perfil

Provedor utilizado

ID exclusivo do usuário

Data de criação

Último acesso

Mostrar a foto e o nome no dashboard.

Exemplo:

Olá, Michael 👋

Se Google ou Apple não fornecer uma foto, utilizar avatar com as iniciais do nome.

6. GOOGLE E APPLE

Implementar corretamente OAuth com Google e Apple.

O sistema deve:

Autenticar o usuário.

Identificar o usuário.

Criar ou recuperar sua conta.

Criar ou recuperar seu perfil.

Verificar se o onboarding já foi concluído.

Enviar para o onboarding se for primeiro acesso.

Enviar para o dashboard se já estiver configurado.

Evitar contas duplicadas.

Considerar corretamente o recurso Hide My Email da Apple.

Não assumir que o e-mail da Apple será sempre o e-mail pessoal do usuário.

7. BANCO DE DADOS

Utilizar Supabase Database.

Cada cliente deve possuir seus próprios dados.

Criar pelo menos estas tabelas:

profiles

id

user_id

full_name

email

avatar_url

provider

created_at

updated_at

onboarding

id

user_id

main_goal

available_time

experience_level

niche

product_status

preferred_channels

monthly_goal

created_at

updated_at

plans

Guardar a estratégia personalizada do usuário.

id

user_id

title

description

strategy

current_stage

progress

created_at

updated_at

tasks

id

user_id

title

description

priority

estimated_time

status

due_date

completed_at

created_at

goals

id

user_id

title

goal_type

target

current

deadline

created_at

updated_at

generated_content

id

user_id

platform

content_type

topic

result

created_at

opportunities

id

user_id

title

description

difficulty

requirements

strategy

first_steps

created_at

generated_offers

id

user_id

product

audience

problem

benefit

price

result

created_at

first_sale_plans

id

user_id

duration

strategy

tasks

progress

created_at

updated_at

ai_conversations

id

user_id

title

created_at

updated_at

ai_messages

id

conversation_id

user_id

role

content

created_at

activity_history

id

user_id

activity_type

description

created_at

8. SEGURANÇA

Esta é uma regra obrigatória:

Um cliente nunca pode acessar os dados de outro cliente.

Implementar Row Level Security (RLS) em todas as tabelas necessárias.

Cada registro deve estar relacionado ao user_id.

Permitir que o usuário:

Veja seus próprios dados

Crie seus próprios dados

Edite seus próprios dados

Exclua seus próprios dados

Nunca permitir acesso cruzado entre contas.

Não confiar apenas em filtros do frontend.

A segurança deve ser aplicada no banco/backend.

9. ONBOARDING

No primeiro acesso, mostrar um onboarding curto e elegante.

Perguntar:

Qual é seu objetivo?

Criar renda extra

Fazer minha primeira venda

Começar no marketing digital

Aumentar minhas vendas

Criar um negócio digital

Quanto tempo você possui por dia?

Menos de 30 minutos

30 minutos

1 hora

2 horas

3 horas ou mais

Qual seu nível?

Iniciante

Já estudei

Já fiz algumas vendas

Já trabalho com marketing digital

O que você deseja vender?

Produto digital

Produto físico

Serviço

Afiliado

Ainda não sei

Qual seu nicho?

Permitir escolher ou escrever.

Onde deseja divulgar?

Instagram

TikTok

Pinterest

WhatsApp

YouTube

Site

Qual sua meta mensal?

Campo numérico.

Depois mostrar:

Analisando seu perfil...

E então:

Seu plano personalizado está pronto.

Salvar todas as respostas no banco.

10. DASHBOARD

Criar um dashboard extremamente minimalista.

No topo:

Olá, [Nome] 👋

Mostrar avatar.

Depois apresentar:

Minha meta

Exemplo:

R$ 1.000/mês

Progresso

Mostrar barra de progresso simples.

Próxima ação

Mostrar apenas a principal tarefa recomendada naquele momento.

Exemplo:

Criar seu primeiro conteúdo

Botão:

Começar

Tarefas de hoje

Checklist simples.

Atividade recente

Mostrar últimas ações realizadas.

Não sobrecarregar o dashboard.

11. MEU PLANO

Criar uma página chamada:

Meu Plano

A IA deve montar um caminho personalizado baseado no onboarding.

Organizar em etapas:

01 — Direção

Definir nicho, público e objetivo.

02 — Oferta

Definir o que vender e como apresentar.

03 — Conteúdo

Criar conteúdo para atrair pessoas.

04 — Divulgação

Escolher canais e estratégias.

05 — Vendas

Transformar interesse em oportunidades de venda.

06 — Otimização

Analisar resultados e melhorar a estratégia.

Cada etapa deve possuir tarefas.

O usuário pode marcar tarefas como concluídas.

12. IDEIAS DE RENDA

Criar ferramenta:

Ideias de Renda IA

A IA deve analisar:

Experiência

Tempo

Nicho

Habilidades

Objetivo

E apresentar oportunidades compatíveis.

Cada resultado deve mostrar:

Oportunidade

Como funciona

Para quem serve

O que precisa

Como começar

Onde divulgar

Primeiros passos

Não prometer ganhos financeiros garantidos.

13. PRIMEIRA VENDA

Criar ferramenta:

Minha Primeira Venda

Permitir escolher:

7 dias

14 dias

30 dias

A IA cria um roteiro de execução.

Exemplo:

Dia 1 — Definir público

Dia 2 — Definir problema

Dia 3 — Estruturar oferta

Dia 4 — Criar conteúdo

Dia 5 — Divulgar

Dia 6 — Conversar com interessados

Dia 7 — Analisar e ajustar

Permitir marcar cada tarefa como concluída.

14. GERADOR DE CONTEÚDO

Criar ferramenta:

Conteúdo IA

Campos:

Produto

Nicho

Público

Plataforma

Objetivo

Gerar:

Hook

Roteiro

Legenda

CTA

Hashtags

Ideia visual

Plataformas:

Instagram

TikTok

Pinterest

YouTube

WhatsApp

Adicionar botão:

Copiar

Salvar os conteúdos gerados no banco.

15. GERADOR DE OFERTA

Criar:

Oferta IA

O usuário informa:

Produto

Público

Problema

Benefício

Preço

Diferencial

A IA gera:

Nome da oferta

Proposta de valor

Benefícios

Diferencial

Objeções

Respostas

CTA

Texto de apresentação

16. ESTRATÉGIA DE VENDAS

Criar:

Vendas IA

Gerar uma estratégia baseada em:

Atração → Interesse → Conversa → Oferta → Follow-up

Criar mensagens para:

Instagram Direct

WhatsApp

Manter linguagem natural e profissional.

17. ASSISTENTE IA

Criar um chat chamado:

Assistente Renda IA

Mensagem inicial:

Olá! Como posso ajudar você a avançar hoje?

Sugestões:

Quero começar do zero

Quero encontrar uma oportunidade

Quero fazer minha primeira venda

Quero criar conteúdo

Quero melhorar minha oferta

Quero vender pelo WhatsApp

Salvar o histórico individualmente.

O usuário deve conseguir iniciar novas conversas.

18. METAS

Criar página:

Minhas Metas

Permitir acompanhar:

Meta de renda

Conteúdos

Leads

Contatos

Ofertas

Vendas

Tarefas

Mostrar progresso visual simples.

19. PERFIL

Criar página:

Meu Perfil

Mostrar:

Foto

Nome

E-mail

Provedor

Nicho

Objetivo

Meta

Tempo disponível

Permitir editar informações que não sejam controladas pelo provedor de autenticação.

20. CONFIGURAÇÕES

Criar:

Preferências

Notificações

Tema claro/escuro

Privacidade

Excluir conta

Sair

21. EXCLUSÃO DE CONTA

Adicionar:

Excluir minha conta

Exigir confirmação.

Ao confirmar:

Excluir dados relacionados ao usuário conforme a política do sistema.

Encerrar sessão.

Redirecionar para login.

Executar a exclusão de maneira segura no backend.

22. ROTAS

Criar:

/

/login

/onboarding

/dashboard

/plano

/tarefas

/oportunidades

/primeira-venda

/conteudo

/oferta

/vendas

/metas

/assistente

/perfil

/configuracoes

Todas as páginas internas devem exigir autenticação.

23. IA

As chamadas de IA devem acontecer de forma segura.

Nunca colocar API keys no frontend.

Utilizar backend/server functions.

Criar prompts internos para:

Plano

Conteúdo

Oferta

Vendas

Oportunidades

Primeira venda

Assistente

As respostas devem ser práticas, personalizadas e realistas.

Nunca prometer:

Dinheiro garantido

Número garantido de vendas

Renda garantida

Resultados garantidos

24. ESTADOS DE INTERFACE

Criar estados profissionais para:

Loading

Carregando...

IA

Criando sua estratégia...

Erro

Não conseguimos concluir esta ação. Tente novamente.

Empty state

Você ainda não possui nenhuma atividade. Comece criando seu primeiro plano.

Nunca deixar telas brancas.

25. RESPONSIVIDADE

O mobile deve ser prioridade.

A plataforma deve funcionar perfeitamente em:

iPhone

Android

Tablet

Desktop

No mobile:

Menu compacto

Cards empilhados

Botões fáceis de tocar

Tipografia adequada

Navegação simples

26. PERFORMANCE

Priorizar:

Carregamento rápido

Código organizado

Componentes reutilizáveis

Poucas requisições desnecessárias

Estados de loading

Cache quando apropriado

27. REGRA SOBRE PAGAMENTO

NÃO criar dentro do SaaS:

Checkout

Página de preços

Planos

Assinaturas

Upgrade

Downgrade

Trial

Área de cobrança

O pagamento acontece externamente.

O SaaS é exclusivamente a área de acesso e utilização do produto adquirido.

28. REGRA FINAL DE QUALIDADE

Antes de finalizar, testar todo o sistema.

Verificar:

Google Login

Apple Login

Sessão

Logout

Perfil

Foto

Banco de dados

RLS

Onboarding

Dashboard

IA

Tarefas

Metas

Conteúdo

Ofertas

Histórico

Responsividade

Mobile

Desktop

Performance

Segurança

Navegação

Corrigir todos os bugs encontrados.

Não criar botões sem função.

Não criar funcionalidades falsas.

Não usar dados mockados como substituição do banco real.

Não deixar páginas incompletas.

O resultado final deve parecer um micro SaaS premium, minimalista, rápido e profissional, pronto para ser utilizado pelos clientes.

A experiência principal deve ser:

Entrar → Responder → Receber direção → Executar → Acompanhar progresso

O produto deve transmitir uma sensação de simplicidade:

menos informação, mais ação.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/403f4865-ca36-4647-975c-e280a31668d4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
