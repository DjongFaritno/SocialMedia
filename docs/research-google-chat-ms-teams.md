# Google Chat and Microsoft Teams research

This branch preserves both integrations from public v2.0.5. Neither service is offered in the next public release. Do not merge this branch into main as a shortcut to enabling them.

## Current evidence

- Google Chat startup redirects through accounts.google.com to the official Workspace Chat landing page. The v2.0.5 navigation fix reaches Sign in, but a real user then received “This browser or app may not be secure”. Reaching a login URL is not proof of successful authentication.
- Google explicitly documents that embedded browsers can be blocked: https://support.google.com/accounts/answer/7675428
- Official desktop OAuth uses a system browser and a registered client: https://developers.google.com/identity/protocols/oauth2/native-app
- A browser OAuth token authorizes API calls; it does not create a Google Chat website login session inside Electron.
- Google Chat API integration needs its own UI, scope review, privacy disclosure and a documented feature matrix: https://developers.google.com/workspace/chat/authenticate-authorize
- Teams needs separate research into supported authentication, tenant/admin policies, account types, SDK/API availability, messaging/calling capabilities and permission/blur coverage. No completed Teams login test is claimed.

## Research acceptance

1. Choose an official supported integration and document personal/work-account limitations.
2. Authenticate using a registered desktop client and external browser when required. Do not import browser cookies or bypass provider login protections.
3. Test real sign-in, sign-out, restart, account isolation and revocation on Windows, macOS and Linux.
4. Define messaging/attachments/notifications/calls and blur coverage against real accounts.
5. Provide clear unsupported states instead of promising working web login.
6. Re-enable each provider only after its acceptance checks pass.

## Existing accounts

Public builds preserve withdrawn-provider metadata under settings.retiredAccounts and leave their session directories untouched. This branch includes that archive as an input to account migration, so research builds can restore those account IDs/names and reuse their original partitions. Use a separate user-data directory or back up the profile when testing research builds; it can run the withdrawn services again.

Branch baseline: bbf89471d35be7764755e9a6e41e44347abe5609 (v2.0.5). No public release is published from this branch.
