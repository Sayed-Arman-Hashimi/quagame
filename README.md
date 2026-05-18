# Quagame Studios

Static website for Quagame Studios and American Ice Cream Simulator.

## Deploying to Vercel

Import this repository in Vercel and keep the default static site settings.
There is no build command and the output is served from the repository root.

## Admin panel

Admin panel path:

```text
https://quagame.vercel.app/admin.html
```

Add these Environment Variables in Vercel before using the admin panel:

```text
ADMIN_EMAIL=sayedarman1352@gmail.com
ADMIN_PASSWORD=<choose-a-strong-password>
ADMIN_SECRET=<long-random-secret>
GITHUB_TOKEN=<classic-or-fine-grained-token-with-repo-contents-write-access>
GITHUB_OWNER=Sayed-Arman-Hashimi
GITHUB_REPO=quagame
GITHUB_BRANCH=main
```

The admin panel edits `content.json` and uploads images under `assets/uploads/` by committing
changes to GitHub. Vercel redeploys automatically after the commit.
