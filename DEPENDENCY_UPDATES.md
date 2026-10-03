# Dependency updates

Renovate automatically squash-merges major, minor, and patch updates after the
checks below pass. New versions must have been published at least seven days ago;
versions without a release timestamp remain pending. pnpm also keeps its existing
seven-day minimum release-age policy for dependency installation.

## Required GitHub protection before enabling this configuration

Protect `main` with both of these required checks, require branches to be up to
date, and do not give Renovate a bypass:

- `Validate static export` from GitHub Actions
- `Vercel` from the Vercel integration

`Vercel Preview Comments` is not a deployment-success check. Renovate's
`platformAutomerge: false` and `ignoreTests: false` keep Renovate in charge of
checking and merging the PR, but GitHub protection is needed to require both
checks even when one has not reported yet. Do not merge this configuration before
the protection is applied and verified.

## Minimal checks

The existing CI job runs frozen installation, lint, type checking, a production
static build, and static-output integrity checks. It additionally runs
`pnpm check:http`: serve the built `out/` directory locally, request every public
HTML page at its clean URL, and require HTTP 200. Generated internal/error pages
are excluded. This adds no dependencies and requires no Vercel preview secrets.

This is intentionally a minimal smoke test for this personal project. It does not
assert page content, appearance, browser JavaScript, or search interactions, and
local serving does not validate Vercel routing. Vercel deployment success remains
a separate required check.

Major upgrades use the same checks as other version updates. For example,
TypeScript 7 currently fails the Nextra/Twoslash build; that failure must block its
merge rather than being bypassed. There is no special version exclusion.

Pin/digest updates, lockfile-maintenance PRs and vulnerability-alert PRs remain
manual. Renovate can create security-alert PRs before the normal age threshold,
so those PRs explicitly have automatic merging disabled.

Static hosting does not eliminate build-time dependency risks; the previously
reported braces advisory remains a separate dependency concern.

## References

- [Renovate automerge](https://docs.renovatebot.com/key-concepts/automerge/)
- [Renovate configuration options](https://docs.renovatebot.com/configuration-options/)
- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
