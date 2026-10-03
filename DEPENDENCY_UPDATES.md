# Dependency updates

## Proposed activation: protected major, minor and patch updates

This configuration enables Renovate squash-merging for major, minor and patch
updates. Do not merge it until the protection checklist below is completed.
Seven days of release age is required; versions without a timestamp remain
pending. pnpm retains its existing seven-day installation policy.

## Required protection before merging this configuration

Protect `main`, require branches to be up to date, and grant Renovate no bypass.
Require both checks from their expected integrations:

- `Validate static export` from GitHub Actions
- `Vercel` from the Vercel integration

`Vercel Preview Comments` is not deployment success. Verify that missing, pending
or failed checks block merging and that checks refer to the PR's current head.
The HTTP 200 smoke check is a separate change in PR #118; merge and verify that
change before activating this configuration.

Keep `platformAutomerge: false`, `ignoreTests: false`, `automergeType: "pr"` and
`automergeStrategy: "squash"`. Renovate performs the merge; GitHub's repository
`allow_auto_merge: false` setting does not stop its native merge fallback.
Required GitHub protection, not a deprecated Renovate `requiredStatusChecks`
option, enforces the CI and deployment gates.

## Scope and safeguards

The existing CI validates frozen installation, lint, type checking, production
static build and static-output integrity. Vercel separately validates deployment.
These checks are minimal and do not guarantee appearance or browser behavior.

Major upgrades use the same gates. TypeScript 7 currently fails the
Nextra/Twoslash build; that failure must block its merge. There is no special
version exclusion.

Pin/digest updates, lockfile-maintenance and vulnerability-alert PRs remain
manual. Renovate's security exception may create alert PRs before seven days,
but their automatic merging stays disabled. Missing timestamps remain blocked,
and branches are rebased when behind `main`.

Static hosting does not eliminate build-time dependency risks, including the
previously reported braces advisory.

## References

- https://docs.renovatebot.com/key-concepts/automerge/
- https://docs.renovatebot.com/configuration-options/#minimumreleaseage
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
