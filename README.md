# Quagame Studios

Static website for Quagame Studios and American Ice Cream Simulator.

## Deploying to Vercel

Import this repository in Vercel and keep the default static site settings.
There is no build command and the output is served from the repository root.

## Inline admin editing

Open the live site and use the `Admin Girişi` button in the header:

```text
https://quagame.vercel.app
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

After login, editable text is changed directly on the page. Image replacement buttons appear on
the images themselves. Saving commits `content.json` and uploaded images under `assets/uploads/`
to GitHub. Vercel redeploys automatically after the commit.
