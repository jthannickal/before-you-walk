# Evaluation — September 4, 2026

## Verified results

- 32/32 synthetic tests passed: 24 policy tests and 8 agent-boundary tests.
- TypeScript check passed.
- Static export completed with exit code 0 using Node 22 and Vinext 1.0.0-beta.9 / Vite 8.2.2. Node 24 on Windows exhibited a native shutdown assertion; use Node 22 for the build.
- npm dependency audit reported zero vulnerabilities after package updates; this is a dependency-advisory snapshot, not a security certification.
- One real Strands inference run completed in 11,071 ms with `gemma4:12b-it-qat` through local Ollama. It executed all five tools and recorded a grounded caretaker fixture before returning the policy answer. Full evidence: `public/evidence/strands-run.json`.
- Browser walkthrough: Check closer options created three simulated requests; recording Market tap's operating reply changed the recommended walk from 18 to 8 fictional minutes; advancing 15 minutes timed out the two unanswered requests.
- WebMCP tools registered with the intended schemas and read/mutation annotations. A valid request for p1 created one request visible in the same UI. An unknown point and an extra read parameter failed intentionally; read-back confirmed state remained intact.

## Not established

This is not a benchmark of model reliability: there is one saved model run, not repeated randomized trials. Unit tests evaluate deterministic safeguards, not real-world outcomes. No external messages, actual caretaker verification, field pilot, water-quality determination, offline delivery, real cost savings, or measured trip reduction occurred. Bedrock configuration exists but was not executed. The public browser interface is a deterministic simulation and recorded trace viewer, not a live hosted agent.

The 60-minute evidence expiry and 15-minute reply timeout are illustrative. Community co-design and validation are prerequisites to real use. English fixture grammar is intentionally narrow; unsupported language or ambiguous input stays unknown.
