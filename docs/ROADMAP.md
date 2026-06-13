# Audut CNMI Roadmap

## Vision
Build a public, community-led disaster recovery starter app for the Northern Mariana Islands that is transparent, locally maintainable, and easy to deploy.

## Phase 1: Open Source Foundation
- Publish the repo on GitHub with a clear MIT license.
- Host the frontend on Vercel at `www.audutcnmi.com`.
- Establish core project identity:
  - mission
  - maintainer credit: PK Daigo
  - contributing guidelines
  - credits and ownership
- Validate the scaffold with a working React + Vite build.
- Document deployment and setup in `docs/DEPLOYMENT.md`.

## Phase 2: CNMI Disaster Response MVP
- Implement a simple document and records management workspace.
- Core features:
  - add, view, and organize documents
  - basic search and filtering
  - record metadata for emergency response use cases
  - retention and legal hold support
  - audit trail for changes
- Make the UI accessible and mobile-friendly.
- Provide sample data and demo flows for CNMI use.

## Phase 3: Local Ownership and Community
- Add collaboration and contribution support:
  - issue templates
  - PR guidance
  - code style and testing notes
- Publish a public project landing page and README mission statement.
- Invite CNMI agencies, partners, and developers to review and contribute.
- Add community-facing docs:
  - how to deploy
  - how to customize
  - how to contribute

## Phase 4: Integration and Deployment
- Connect the app to a backend or data platform for real deployments.
- Recommended hosting options:
  - frontend: Vercel
  - backend/data: Supabase or Azure-enabled services
- Ensure deployment is repeatable and documented.
- Add environment configuration examples and secure deployment notes.

## Phase 5: Growth and Resilience
- Add support for local data sovereignty and disaster recovery workflows.
- Expand features for CNMI operators:
  - incident logs
  - recovery task tracking
  - user roles and access controls
  - offline or low-bandwidth readiness
- Maintain a predictable release cadence and roadmap updates.

## Next Steps
1. Finalize the public GitHub repo and verify the Vercel deployment.
2. Create an MVP issue list with the first feature set.
3. Start building the first version of the document management workspace.
4. Track progress with `docs/ROADMAP.md` and keep the plan visible.
