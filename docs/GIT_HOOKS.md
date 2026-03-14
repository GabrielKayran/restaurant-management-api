# 🔧 Git Hooks Setup

Este projeto contém Git Hooks configurados para rodar **lint** e **testes** automaticamente antes de cada `git push` **para a branch `main`**.

## 📋 O que faz?

Quando você executa `git push`:

### Na branch `main`:
1. **ESLint** - Valida e corrige problemas de estilo de código
2. **Testes** - Executa os testes unitários

Se algum deles falhar, o push é bloqueado até que os problemas sejam corrigidos.

### Em outras branches:
✅ Push é permitido **sem verificações**

Isso permite desenvolvimento rápido em branches de desenvolvimento, enquanto protege a branch `main` com qualidade garantida.

---

## 🌿 Comportamento por Branch

### `main` - ✅ Protegida
```bash
$ git push origin main
🔍 Iniciando verificacoes antes do push para MAIN...
📝 Rodando ESLint...
✅ ESLint passou!
🧪 Rodando testes...
✅ Testes passaram!
🎉 Todas as verificacoes passaram! Permitindo push...
```

### Outras branches (develop, feature/*, etc) - ⏭️ Livre
```bash
$ git push origin develop
⏭️  Branch 'develop' - Pulando verificações (apenas main)
```

---

## ⚙️ Instalação

### Windows (PowerShell)

Execute o script de setup:

```powershell
.\scripts\setup-hooks.ps1
```

Ou manualmente:

```bash
# Copiar o arquivo de hook para a pasta correta
Copy-Item ".git\hooks\pre-push" -Destination ".git\hooks\pre-push" -Force
```

### macOS / Linux

Execute o script de setup:

```bash
bash scripts/setup-hooks.sh
```

Ou manualmente:

```bash
# Tornar o hook executável
chmod +x .git/hooks/pre-push
```

---

## 🚀 Como usar

Após a instalação, simplesmente use git normalmente:

```bash
# Em qualquer branch - push rápido
git push origin feature/minha-feature

# Em main - com verificações automáticas
git push origin main
```

---

## ⏭️ Pular o hook (quando necessário)

Se precisar fazer push sem rodar as verificações, use a flag `--no-verify`:

```bash
git push --no-verify
```

⚠️ **Não recomendado para a branch `main`!**

---

## 📂 Estrutura

```
.git/hooks/
├── pre-push          # Hook para macOS/Linux (bash)
├── pre-push.bat      # Hook para Windows (batch)
└── pre-push.ps1      # Hook para Windows (PowerShell)

scripts/
├── setup-hooks.sh    # Script de setup para macOS/Linux
└── setup-hooks.ps1   # Script de setup para Windows
```

---

## 🔍 Scripts no package.json

Os hooks usam os seguintes scripts do projeto:

- `npm run lint` - Executa ESLint com auto-fix
- `npm test` - Executa testes com Jest

---

## ✨ Exemplo de Execução

### Push na branch develop (sem verificações):
```bash
$ git push origin develop
⏭️  Branch 'develop' - Pulando verificações (apenas main)
```

### Push na branch main (com verificações):
```bash
$ git push origin main
🔍 Iniciando verificacoes antes do push para MAIN...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Rodando ESLint...
✅ ESLint passou!

🧪 Rodando testes...
✅ Testes passaram!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Todas as verificacoes passaram! Permitindo push...
```

---

## 🆘 Troubleshooting

### Hook não está sendo executado no Windows

O Git no Windows pode não usar hooks shell por padrão. Tente:

```bash
# Configurar Git para usar Windows
git config core.hooksPath .git/hooks

# Ou configurar globalmente
git config --global core.hooksPath .git/hooks
```

### "Permission denied" no macOS/Linux

Certifique-se de que o arquivo tem permissões de execução:

```bash
chmod +x .git/hooks/pre-push
```

### Testes passam localmente mas falham no hook

Certifique-se de rodar:

```bash
npm install
npm test
```

Localmente antes de fazer push.

---

## 📖 Mais Informações

- [Documentação de Git Hooks](https://git-scm.com/docs/githooks)
- [Pre-push Hook Documentation](https://git-scm.com/docs/githooks#_pre_push)
