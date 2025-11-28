# GitHub Actions Workflows - Wetterpendeln App

Dieses Repository verwendet GitHub Actions für automatisierte CI/CD-Prozesse.

## 🔄 Workflows

### 1. **CI/CD - Next.js App** (`npm-grunt.yml`)
Haupt-CI-Workflow für Code-Qualität und Build-Prozess.

**Trigger:**
- Push auf `main` Branch
- Pull Requests auf `main` Branch

**Jobs:**
- **🔍 Lint & Type Check**: ESLint + TypeScript Checks
- **🏗️ Build App**: Next.js Production Build mit pnpm
- **🧪 Test Build**: Health Check auf gebauter App (nur PRs)
- **🔒 Security Audit**: pnpm audit für Sicherheitslücken

**Features:**
- Node.js 24.x mit pnpm
- Build-Artefakte werden 7 Tage gespeichert
- Continue-on-error für Lint (wegen v0.app Sync)

---

### 2. **Deploy to Vercel** (`deploy.yml`)
Automatisches Deployment nach Vercel Production.

**Trigger:**
- Push auf `main` Branch
- Manuell via `workflow_dispatch`

**Benötigte Secrets:**
Konfiguriere diese in GitHub Settings → Secrets and variables → Actions:

```bash
VERCEL_TOKEN          # Vercel API Token
VERCEL_ORG_ID         # Vercel Organization ID
VERCEL_PROJECT_ID     # Vercel Project ID
```

**Setup:**
1. Vercel Token erstellen: https://vercel.com/account/tokens
2. Projekt-IDs abrufen:
   ```bash
   cd /mnt/c/Users/gummi/Documents/wetterpendelnwebappmain
   vercel link
   cat .vercel/project.json
   ```
3. Secrets in GitHub Repository hinzufügen

**Jobs:**
- **🚀 Deploy to Production**: Build & Deploy mit Vercel CLI
- Deployment-URL wird in Summary angezeigt
- Production Environment in GitHub

---

### 3. **Dependency Updates** (`dependencies.yml`)
Wöchentliche Überprüfung veralteter Dependencies.

**Trigger:**
- Jeden Montag 9:00 UTC (Cron)
- Manuell via `workflow_dispatch`

**Jobs:**
- **📦 Check for Updates**: `pnpm outdated` Report
- Outdated-Liste als Artifact (30 Tage)

---

## 🚀 Setup-Anleitung

### Vercel Deployment aktivieren:

```bash
# In WSL Ubuntu
cd /mnt/c/Users/gummi/Documents/wetterpendelnwebappmain

# 1. Vercel CLI installieren (falls nicht vorhanden)
pnpm add -g vercel

# 2. Mit Vercel verbinden
vercel login
vercel link

# 3. Projekt-IDs kopieren
cat .vercel/project.json
# Output:
# {"orgId":"xxx","projectId":"yyy"}
```

**Secrets in GitHub hinzufügen:**
1. Gehe zu: https://github.com/TimInTech/pendllwetter/settings/secrets/actions
2. Klicke "New repository secret"
3. Füge hinzu:
   - `VERCEL_TOKEN` → von https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` → aus `.vercel/project.json`
   - `VERCEL_PROJECT_ID` → aus `.vercel/project.json`

---

## 📊 Workflow Status

[![CI/CD](https://github.com/TimInTech/pendllwetter/actions/workflows/npm-grunt.yml/badge.svg)](https://github.com/TimInTech/pendllwetter/actions/workflows/npm-grunt.yml)
[![Deploy](https://github.com/TimInTech/pendllwetter/actions/workflows/deploy.yml/badge.svg)](https://github.com/TimInTech/pendllwetter/actions/workflows/deploy.yml)

---

## 🔧 Wichtige Hinweise

### Node Version
- Workflows verwenden **Node.js 24.x** (wie im Projekt-Setup)
- Runtime: WSL Ubuntu-24.04 (lokal), ubuntu-latest (Actions)

### Package Manager
- **Nur pnpm** wird verwendet (kein npm/yarn)
- Lockfile: `pnpm-lock.yaml` muss committed sein

### TypeScript & ESLint
- `continue-on-error: true` bei Lint/Type-Checks
- Grund: `next.config.mjs` hat `ignoreBuildErrors: true` (v0.app Workflow)
- Builds schlagen trotz Warnings nicht fehl

### Build-Artefakte
- `.next/` wird hochgeladen (ohne Cache)
- Retention: 7 Tage
- Nutzbar für Debugging fehlgeschlagener Builds

---

## 🐛 Troubleshooting

**Workflow schlägt bei `pnpm install` fehl:**
- Prüfe ob `pnpm-lock.yaml` committed ist
- Lokal testen: `pnpm install --frozen-lockfile`

**Deployment schlägt fehl:**
- Secrets korrekt konfiguriert?
- Vercel CLI lokal testen: `vercel --prod`

**Build dauert zu lange:**
- Next.js Caching wird automatisch genutzt
- Build-Zeit normal: 2-4 Minuten

---

## 📝 Weitere Workflows (Optional)

Weitere mögliche Erweiterungen:
- **Lighthouse CI**: Performance-Checks
- **Preview Deployments**: Automatische Preview-URLs für PRs
- **Dependabot**: Automatische Dependency-Updates (Alternative zu dependencies.yml)
