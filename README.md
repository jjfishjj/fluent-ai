# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## 🎮 仙境奇俠傳 3D — 線上試玩

一個仿《仙境傳說》風格的 3D 動作 MMORPG，用 three.js 即時渲染，
場景、角色與怪物全部由程式產生，不需下載任何模型檔。

**Demo：** https://jjfishjj.github.io/fluent-ai/xianjing　（本機開發：`npm run dev` → http://localhost:8080/xianjing）

- 4 種職業、16 個技能、8 種怪物含首領，4 張地圖與主線任務
- 點擊移動 / 選取目標的即時戰鬥，支援電腦與手機觸控
- 有設定 Supabase 時會同步真人玩家，否則自動改用模擬玩家
- 架構說明見 [`docs/xianjing-3d-mmorpg.md`](docs/xianjing-3d-mmorpg.md)

> Demo 由 `.github/workflows/deploy-quizzes.yml` 在推上 `main` 後自動部署到 GitHub Pages
> （Pages 已啟用並持續部署成功，不需要額外設定）。

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
