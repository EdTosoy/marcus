# Phase 0 and Phase 1A acceptance

## Scope

One working local application and a complete first lesson. No commits, external publishing, deployment, database, authentication, Stockfish, OpenAI API, multiplayer, payments, or remote learning services.

## Acceptance and evidence map

| Acceptance criterion                                          | Evidence                                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Strict TypeScript, Next App Router, React, Tailwind, pnpm     | Package and framework configuration; typecheck and production build                      |
| Modular domain with no UI/framework imports                   | `src/domain/` code inspection; domain tests import it without React                      |
| Maintained React board with compatible React peer version     | Registry metadata, installed declarations, `pnpm peers check`, real browser journeys     |
| Correct FEN loading, legal movement, notation and orientation | Chess integration tests; practice board browser tests                                    |
| Promotion, castling, en passant, check and terminal states    | Domain scenarios; actual UI special-move browser scenario                                |
| Piece selection and legal destination markers                 | Browser selection assertions, mobile touch tests, keyboard movement                      |
| Lesson content separate from UI; typed reusable definitions   | Curriculum module, answer union, schema invariants and explicit multi-answer test        |
| Five curated practice positions and distinct assessment       | Content validation and examples, exhaustive legal move acceptance tests                  |
| Conceptual hints, errors, feedback and unlimited retry        | Session tests and complete browser lesson with mistakes and hints                        |
| Completion gated by correct responses                         | Transition tests, final assessment and reflection browser journey                        |
| Attempts, hints, independent success and assessment persisted | Progress tests, decoding tests, reload during practice and after completion              |
| Completion does not imply mastery                             | Explicit domain result, product copy, tests                                              |
| Smartphones and desktop usable                                | Desktop and mobile Chromium projects; touch, overflow, instruction order and screenshots |
| Practical keyboard access and reduced motion                  | Roving square focus, arrow/Enter browser test, reduced-motion scenario                   |
| Storage failure does not block learning                       | Corrupt JSON and blocked Storage browser scenario                                        |

## Required commands

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm peers check
```

Playwright runs the production build at `http://127.0.0.1:3100`, with two projects: 1440px desktop Chromium and iPhone 13 viewport/touch emulation using Chromium. A separate 375px layout check verifies overflow, instruction placement, reduced motion, and keyboard use. These are emulated browsers, not physical-device evidence.

The complete journey includes the visual explanation, a wrong identification, two hints, reload, retry, a legal unsafe bishop move, SAN feedback, undo, all practice decisions, first-attempt transfer, reflection, persisted completion, and a repeat run. Other scenarios cover FEN errors, orientation, special moves, checkmate, and unavailable storage.

Screenshots, traces on failure, and HTML reports are local, ignored artifacts in `test-results/` and `playwright-report/`. Visual review screenshots are in `artifacts/` when generated.

## Verification record

See the completed [verification results](VERIFICATION.md) for executed commands, exact totals, environment issues, inspected screenshots, and remaining gaps. Build and test success alone do not validate learning effectiveness.

## Remaining release gates

- Independent chess educator review of wording, position selection, hints, and alternative-answer policy
- Beginner usability sessions, including physical phones and keyboard/screen-reader users
- Delayed, varied-position skill measurements before making any mastery or efficiency claims
- Broader browser coverage, persistence migration policy, and cross-tab behavior if those become product requirements
