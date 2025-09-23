---
applyTo: "**"
---

## Big picture

- Stack: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4 (shadcn/ui).
- Auth/session: Supabase SSR with cookie refresh in middleware.
- Structure: `app/(home)` public; `app/(afterAuth)/home/**` authenticated (create, explore, profile); server actions in `util/actions/**`; Supabase helpers in `util/supabase/**`; UI in `components/**`; helpers in `lib/**`.

---

## Dev workflow

- Scripts: `bun dev` (Turbopack), `bun build`, `bun start` (npm/pnpm/yarn also fine).
- Env required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Images allowlist: `next.config.ts` permits `https://*.supabase.co`.

---

## Purpose

Provide strict instructions for GitHub Copilot (VS Code) when **investigating bugs, performing code analysis, or suggesting minimal patches** in this repository.

This is a **universal SOP**, covering:

* Auth metadata (Supabase or similar)
* Database tables, columns, RLS, triggers, functions
* Storage buckets or files
* Any user-related state, configuration, or related flows

---

## Golden Rules

1. **Do not hallucinate.**

   * Never assume tables, columns, triggers, or fields exist without explicit confirmation.
   * Only reference what is proven via code search, DB query, storage inspection, or logs.

2. **Do not create or modify schema, auth resources, or storage** unless explicitly requested.

   * Any fix should be **proposed**, not executed.

3. **Minimal, safe changes only.**

   * One logical change per patch.
   * Always explain the reason, affected scope, and test plan.

4. **Evidence first.**

   * Collect code search results, DB/metadata outputs, storage policies, auth payloads, or API responses before suggesting changes.

5. **Scope of investigation**

   * Default directories:
     * #app/
     * #codebase
   * Include storage handlers if relevant (Supabase buckets, S3, local FS, etc.)

6. **Available tools**

   * **Read-only DB/metadata server** (Supabase MCP or similar):

     * ✅ Allowed: query schema, RLS, triggers, functions, auth metadata, storage buckets
     * ❌ Not allowed: insert, update, delete, or alter tables, auth, triggers, or buckets
     * Fixes should be proposed as **diffs or SQL snippets**, never executed.
   * **Documentation server** (Context7 MCP or equivalent):

     * ✅ Allowed: query latest docs for APIs, storage, auth flows, and metadata patterns.

---

## Investigation Checklist (Universal)

1. **Code search**

   * Literals to search: `user_metadata`, `auth.update`, `auth.updateUser`, `profiles.update`, `profiles.upsert`, `setMetadata`, `syncProfile`, `settings`, `storage`, `bucket`, `file`
   * Record **file path, line number, snippet** for each match.

2. **DB/metadata inspection**

   * List tables and columns.
   * Inspect triggers, functions, and RLS policies.
   * Check auth metadata (any field) for read-only updates.
   * Check storage buckets and permissions.

3. **Handler tracing**

   * Identify the function responsible for the change.
   * Determine if it updates auth metadata, tables/rows, or storage objects/policies.

4. **Hypothesis testing**

   * Check for unintended overwrites.
   * Confirm no sensitive fields are cleared.
   * Ensure background jobs, triggers, or edge functions do not overwrite critical metadata.

---

## Safe Update Patterns

* **Auth metadata (merge & strip undefined)**

  ```ts
  const current = (await supabase.auth.getUser()).data.user?.user_metadata || {};
  const merged = { ...current, ...incomingMetadata };
  Object.keys(merged).forEach(k => merged[k] === undefined && delete merged[k]);
  await supabase.auth.updateUser({ data: merged });
  ```

* **Table update (explicit fields only)**

  ```ts
  await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId);
  ```

* **Storage inspection (read-only)**

  ```ts
  const { data: buckets } = await supabase.storage.listBuckets();
  const { data: files } = await supabase.storage.from('bucket').list();
  ```

---

## Deliverables for Every Investigation

1. **Evidence** — search results, SQL outputs, bucket info, API responses.
2. **Root cause statement** — one line explaining the bug/issue.
3. **Minimal patch** — unified diff or code snippet with explanation.
4. **Test plan** — verify changes without side effects.
5. **Rollback instructions** — how to revert safely.
6. **Risk assessment** — list possible side effects and mitigations.

---

## Quick Guardrail (Universal)

```
1. Do not hallucinate resources; always confirm existence.
2. Only read/inspect DB, auth, or storage; never write unless requested.
3. One logical change per patch.
4. Merge metadata, strip undefined fields.
5. Update explicit table columns only.
6. Capture evidence (code search + DB/storage outputs) first.
7. Escalate if schema, auth, or bucket changes are needed.
8. Test locally before proposing patch.
9. Label PR with clear context.
10. Provide rollback and risk mitigation.
```