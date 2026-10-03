# Dependency updates

## Current stage: validation first

Renovate is deliberately paused for **automatic merging**, not update PR creation.
The repository previously enabled minor/patch automerge without required checks.
GitHub's repository-level `allow_auto_merge: false` is not a reliable kill switch:
Renovate can fall back to merging the PR itself.

This change adds the always-run `Validate static export` GitHub Actions check:

- frozen pnpm install, with the existing seven-day supply-chain policy
- type-aware lint and TypeScript type checking
- production static build and Pagefind indexing
- integrity checks for every post, RSS entries, tag/navigation links, local assets,
  search-index output, and absence of runtime image-optimizer URLs

`Vercel` is the deployment-success status. `Vercel Preview Comments` only reports
comment creation and is **not** a substitute for a successful preview deployment.

## Activation checklist (requires owner approval)

Do not enable automerge until all steps below have been reviewed and completed:

1. Run this PR's CI and Vercel preview successfully, then merge the validation work.
2. Protect `main` using a GitHub ruleset or branch protection. Require both
   `Validate static export` (GitHub Actions) and `Vercel` (Vercel App) before merging.
   Bind checks to their expected integrations and require the branch to be up to
   date. Keep Renovate subject to the requirements (no bypass). Do not require
   `Vercel Preview Comments` or the Renovate-only age status on every PR.
3. Verify with a Renovate PR that a missing, pending, or failed CI/Vercel check
   prevents merging. Confirm the required checks refer to the PR's current head.
4. In a separate reviewed change, change only the minor/patch rule to:

   ```json
   {
     "matchUpdateTypes": ["minor", "patch"],
     "automerge": true
   }
   ```

   Keep the top-level `automerge: false`, `platformAutomerge: false`,
   `automergeType: "pr"`, `automergeStrategy: "squash"`, and `ignoreTests: false`.
   Renovate will perform the merge only after checks pass; it does not need
   GitHub's platform auto-merge setting enabled. Do not use the deprecated
   `requiredStatusChecks` Renovate option as a substitute for GitHub protection.

The activation scope is patch/minor updates only. Majors, lockfile-maintenance,
pin/digest updates, and vulnerability-alert PRs remain manual. Seven days of
release age is required before ordinary updates are proposed; missing release
timestamps remain pending. Vulnerability PRs may be created sooner by Renovate's
security exception but cannot auto-merge.

TypeScript 7 is not compatible with the current Nextra/Twoslash API; keep that
major upgrade manual until verified. Any known dependency advisory still needs
separate review: static serving reduces server exposure but does not remove
build-time dependency risks (including the previously reported braces advisory).

## References

- [Renovate automerge](https://docs.renovatebot.com/key-concepts/automerge/)
- [Renovate configuration options](https://docs.renovatebot.com/configuration-options/)
- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
