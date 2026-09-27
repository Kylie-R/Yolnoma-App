<div>
<img align='left' width="40px" src=".github/images/logo.png" alt="logo">
<h1 align="right">Yolnoma</h1>
</div>

<img src=".github/images/brand.jpg" alt="yolnoma app brand wallpaper">

**Yolnoma-App** is an independent Windows desktop utility created and maintained by
**Jasurbek Haydarov** under **JK Software**. It brings practical developer tools,
media utilities, and Steam-related workflows together in a single fast
[Tauri](https://tauri.app/) desktop application.

> Yolnoma-App is not affiliated with, endorsed by, or sponsored by Valve
> Corporation or Steam.

---

## Table of contents

- [Highlights](#highlights)
- [Tools and features](#tools-and-features)
- [Screenshots](#screenshots)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Configuration and secrets](#configuration-and-secrets)
- [Privacy and data flow](#privacy-and-data-flow)
- [Project identity](#project-identity)
- [About the author](#about-the-author)
- [Acknowledgements](#acknowledgements)
- [Security](#security)
- [License](#license)
- [Contributing](#contributing)

## Highlights

- 🖥️ **One desktop app** for developer, media, and everyday utilities.
- ⚡ **Fast native shell** built with Tauri, React, and Bun.
- 🔐 **Local-first data** — AI chat history and account data stay on your machine.
- 🧩 **Extensible toolset** — new tools are added continuously between releases.
- 🤖 **Bring your own AI key** — no shared server-side key, no vendor lock-in.

## Tools and features

| Tool                   | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Dashboard**          | Yolnoma workspace with quick access to all application tools.                |
| **Developer Tools**    | JWT, JSON, Markdown, UUID, IP lookup, QR code, CSS, and related utilities.   |
| **Background Remover** | Image background-removal workflow.                                           |
| **AI Chat**            | General questions and coding help, with locally stored conversation history. |
| **Steam Idler**        | Idle and achievement-management integrations.                                |
| **Media Utilities**    | YouTube video downloader and related media helpers.                          |
| **Network Tools**      | Port scanner and IP-related utilities.                                       |
| **File Utilities**     | Everyday image, media, and file helpers.                                     |

The exact feature set may change between releases — consult the source code and
the release notes for the version you are using.

## Screenshots

| Dashboard                                                                 | Developer Tools                                                           | Background Remover                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <img src=".github/images/app/dashboard.png" alt="dashboard" width="100%"> | <img src=".github/images/app/workspace.png" alt="workspace" width="100%"> | <img src=".github/images/app/bg_remover.png" alt="background remover" width="100%"> |

## Requirements

- **Windows 10** or later for the full desktop feature set.
- **[Bun](https://bun.sh/) 1.4+** for frontend development and dependency management.
- **Rust** and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for desktop builds.
- A **Steam account** for Steam-related features.

Some integrations require their own API credentials (see
[Configuration and secrets](#configuration-and-secrets)).

## Getting started

```bash
# 1. install dependencies
bun install

# 2. copy the environment template and fill in the values you need
cp .env.example .env

# 3. start the development application
bun run tauri dev
```

## Available scripts

| Command         | Description                                |
| --------------- | ------------------------------------------ |
| `bun run td`    | Start the desktop app in development mode. |
| `bun run build` | Build the frontend bundle.                 |
| `bun run tb`    | Build a distributable desktop application. |

The release workflow creates signed updater artifacts. The Tauri updater private
key must stay **outside** the repository and be supplied through the
`TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` GitHub
Actions secrets.

## Configuration and secrets

- `.env.example` contains **variable names only**. Copy it locally and fill in
  your own values.
- Values prefixed with `VITE_` are embedded into the frontend build and are
  therefore **visible in the compiled application** — never treat them as
  server-side secrets.
- Never commit real API keys, passwords, session tokens, or signing keys. Use
  local environment files or GitHub Actions secrets.

## Privacy and data flow

AI Chat conversations are stored **locally** on your computer as JSON session
files. On Windows the current location is:

```text
%LOCALAPPDATA%\Yolnoma\accounts\<user-id>\ai-chat\sessions\<session-id>.json
```

When you send a prompt, the prompt, the selected project context, and the
required request metadata are transmitted to the configured AI provider
(currently **OpenRouter**) so that a response can be generated. Chat history is
**not** uploaded to a Yolnoma-owned database, and Yolnoma does not provide a
shared AI key — you supply your own.

> ⚠️ Do not send passwords, private keys, access tokens, or confidential source
> code unless you have reviewed and accepted the provider's terms and privacy policy.

For the complete security boundaries, data-flow notes, credential guidance, and
vulnerability-reporting process, see [SECURITY.md](./SECURITY.md).

## Project identity

Yolnoma-App is **not** a republished copy of another project. The application,
product direction, user interface, desktop shell, developer-tool collection,
media utilities, account-storage work, and integrations in this repository are
part of the Yolnoma project and are maintained by its own author and
contributors.

The repository does contain a clearly identified Steam integration derived from
or based on [Steam Game Idler](https://github.com/zevnda/steam-game-idler) by
**zevnda**. That upstream attribution is preserved because it is required for
those derived portions; it does not mean that Yolnoma-App is an official Steam
Game Idler release. See
[THIRD-PARTY-NOTICES.md](./src-tauri/THIRD-PARTY-NOTICES.md) for detailed
license and attribution information.

## About the author

**Jasurbek Haydarov** is the founder, developer, and creator of Yolnoma-App. He
builds practical desktop software for developers, creators, and everyday users,
with a focus on bringing useful workflows into a single fast and accessible
application.

Yolnoma-App is an actively evolving project. Contributions, responsible bug
reports, and constructive feedback are welcome through the repository.

## Acknowledgements

Thank you to the authors and maintainers of Steam Game Idler, SteamKit2, Tauri,
React, and the many other open-source projects that make Yolnoma-App possible.

## Security

Do not report private credentials in a public issue. For a suspected security
problem, contact the maintainers privately before disclosure — see
[SECURITY.md](./SECURITY.md) for the full policy.

## License

Original Yolnoma-App code is source-available under the
[Elastic License 2.0](./LICENSE), Copyright (c) 2026 Jasurbek Haydarov and
contributors, except where a file or notice identifies another license.

Third-party components remain under their own licenses — read
[THIRD-PARTY-NOTICES.md](./src-tauri/THIRD-PARTY-NOTICES.md) before
redistributing source or binaries.

> Elastic License 2.0 is **source-available**, not an OSI-approved open-source
> license. It permits use, modification, and redistribution subject to its terms,
> including restrictions on hosted services and license-key functionality.

## Contributing

Issues, bug reports, and pull requests are welcome. Please read
[CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
before submitting changes.
