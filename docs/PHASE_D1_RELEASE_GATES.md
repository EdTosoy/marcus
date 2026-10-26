# Phase D1 release gates

Updated 2026-10-26 after D0.1. **NO-GO remains in force.** Technical engine source preparation is complete; legal, account-use and release approvals are separate. No cloud configuration mutation or deployment was performed.

## Gate status

| Gate                                | State                   | Required closure                                                                                                                                                                                         |
| ----------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact engine/source/input mapping   | **Technical PASS**      | Keep the pinned version, digests, complete source archive and verified recipe together; any change requires renewed checks.                                                                              |
| Recipient-facing source and notices | **Prepared locally**    | Preserve equivalent binary/source access on the actual protected HTTPS preview. Confirm a named source-retention owner and durable archive location.                                                     |
| Application licensing               | **BLOCKED**             | Qualified review and owner approval of A/B/C in [the application assessment](APPLICATION_LICENSE_ASSESSMENT.md), bound to the exact release. No inferred approval or automatic relicensing.              |
| Hobby usage eligibility             | **UNRESOLVED**          | Owner records financial purpose, paid development/hosting involvement, product/service promotion and intended audience; obtain Vercel clarification if uncertain. No revenue is not sufficient evidence. |
| Pilot viewer access                 | **UNRESOLVED**          | Confirm actual authorized recipients fit Hobby access limits and that recipient terms preserve applicable GPL rights.                                                                                    |
| Repository/source visibility        | **OWNER DECISION**      | Earlier private-source requirement differs from the observed public GitHub repository. Resolve before any later push or relying on GitHub for recipient source. No visibility change is authorized here. |
| All Deployments protection          | **D1 CHANGE PROPOSED**  | Explicitly authorize and apply only the protection-scope update below; verify it without exceptions that expose the pilot.                                                                               |
| Exact candidate and verification    | **D0.1 local evidence** | Freeze final source/archive hashes, review upload scope, and verify the intended project/account again before D1. Check actual output for optional native libraries and associated obligations.          |
| Preview deployment                  | **NOT AUTHORIZED**      | Obtain explicit authorization for one protected preview after gates close. Commit/push, production, promotion and broader cloud changes require their own scope of authorization.                        |

## Corrected Vercel protection finding

Vercel's **September 9, 2026** announcement makes Vercel Authentication for **All Deployments**, including production domains, available at no additional cost on **every plan**, including Hobby. This supersedes older documentation/skill statements requiring a paid production-protection add-on. The current protection documentation, updated September 15, also confirms this. Password Protection is a different paid/plan-limited mechanism; it is unnecessary for the proposed authentication scope. [Dated announcement](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan), [current protection scopes](https://vercel.com/docs/deployment-protection)

Read-only account inspection in D0.1 confirms:

- Scope `edtosoys-projects`, team `team_fnmo0AOdULr7rFrGsUl9Pakx`, active Hobby context; caller role OWNER.
- Existing `marcus`, project `prj_fdp1FWAMpF5wHBw1XwXHbnCX1RWt`.
- Current `ssoProtection.deploymentType` is **`all_except_custom_domains`**, the legacy standard scope. It has **not** been changed to `all`.
- No Git link, live deployment, latest deployment or production target is configured. D0.1 did not connect Git or change this state.

The existing project is eligible for All Deployments authentication on its plan. This does not establish that the setting is enabled, that every tester can access it, or that an authenticated download satisfies every legal obligation.

### Proposed D1 configuration change — not executed

After explicit authorization for this cloud setting change:

1. Reinspect the exact team/project and record the existing protection scope.
2. In **marcus → Settings → Deployment Protection → Vercel Authentication**, select **All Deployments** and save. Leave password protection, team permissions, Git integration, DNS and billing unchanged.
3. Read project metadata again and require `ssoProtection.deploymentType: all`.
4. Review protection exceptions, shareable links and automation/trusted-source bypasses without retrieving or logging their secret values. Do not create a source-only public exception or a binary-only private rule.
5. On the future deployment, verify an unauthenticated client cannot retrieve the app, worker, WASM or source archive, and an authorized client can retrieve all of them. Test the actual production domain too only if a separately authorized production release later exists.

The documented API representation, for review rather than execution, is:

```json
{
  "ssoProtection": {
    "deploymentType": "all"
  }
}
```

The official authentication documentation describes this enum and management path. It also limits Hobby to **one external user per account** for granted access. Decide whether that fits the pilot; shareable links or other bypasses affect the access model and must not be silently substituted. [Authentication configuration and access](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)

## Hobby non-commercial eligibility

Vercel restricts Hobby to personal, non-commercial use. Its commercial-use definition considers financial gain by anyone involved in creating or operating the deployment, including paid development/consulting, sales promotion, payments and advertising. A free pilot, no current revenue, an educational purpose or GPL licensing alone does not decide eligibility. Confirm the actual facts and intended use; contact Vercel Support if uncertain. No support message, plan upgrade or billing action was taken. [Current fair-use guidance](https://vercel.com/docs/limits/fair-use-guidelines)

Owner record needed: who owns/operates Marcus; who funded or was paid for development/hosting; whether the pilot promotes an intended commercial product/service; whether any participant/organization pays; and who needs access. If the use falls outside Hobby, separately approve an appropriate plan before deployment.

## Preview acceptance and rollback

Once the legal/account gates and explicit preview authorization are complete, use the existing project's manual CLI preview route described in [D0](PHASE_D0_DEPLOYMENT_READINESS.md), with the All Deployments correction above. A Git push is unnecessary. Link only the existing project and stop on a create-project prompt or unexpected production target. Run the frozen install and the existing Webpack build/engine preparation; do not skip source packaging.

Record the candidate source fingerprint, engine/source hashes, deployment ID/URL, build result, protection checks and recipient-access results. Verify every release-facing license/source URL on HTTPS, worker/WASM MIME/hash correctness, one legal engine reply, existing learning/gameplay regressions, local persistence and browser errors. Vercel's eventual build output must be checked for optional native components: if libvips or another separately licensed native dependency is actually included, finish its applicable notice/source/relinking review before sharing that distribution. Do not claim the engine archive covers other libraries.

There is currently no previous remote deployment to restore. If the first preview fails, stop the pilot and use the verified local build while diagnosing it. Do not promote, change aliases, delete resources or weaken protection. Later previews may return testers to a previous verified URL, subject to source retention and browser-origin data boundaries. Production staging, promotion and rollback remain separately authorized future work.
