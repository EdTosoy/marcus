# Verified coaching benchmark

Source: `src/domain/coaching/benchmark.ts`; checks: `src/domain/coaching/benchmark.test.ts`. These 14 fixed boards are regression material, not calibrated assessments or independently approved curriculum. Do not reuse exposed benchmark positions as unfamiliar post-tests.

| ID                         | Coverage                          | Verified or qualified claim                                                   |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| hanging-rook               | Undefended versus hanging         | No defender does not itself establish an attack                               |
| rook-into-bishop           | Unsafe destination, hanging piece | Ra4 allows Rxa4; the initial bishop attack is separately checked              |
| defended-rook              | Attacked and defended             | Both attacker and defender exist; one does not cancel the other               |
| immediate-rook-capture     | Simple capture                    | Rxd4 is legal; no broader strategic claim                                     |
| offered-exchange           | Capture without automatic blame   | Rd5 Rxd5 Qxd5 is a legal conditional exchange                                 |
| missed-capture             | Unchosen immediate capture        | Rxd4 is available before Re2; that does not prove Re2 a blunder               |
| pawn-threat                | Threat recognition                | Nh4 allows gxh4                                                               |
| multiple-answers           | Fair alternatives                 | Bb4 and Bd4 both meet the no-attacks rule                                     |
| smothered-sacrifice        | Sound forcing sacrifice           | Qg8+ forces Rxg8 and Nf7#; every immediate legal defense is covered           |
| mate-on-attacked-square    | Terminal exception                | Qg7# is mate despite the king’s geometric attack pattern                      |
| en-passant-threat          | Special capture                   | e4 allows dxe3 en passant, removing the pawn from e4                          |
| quiet-uncertainty          | Insufficient diagnostic evidence  | Nf3 is legal; intent and weakness are not inferable                           |
| stalemate                  | Terminal result                   | Qf7 creates stalemate; desirability is context-dependent                      |
| pinned-capture-uncertainty | Attack versus legal capture       | After Nd7 the rook is pinned and Kxd7 is illegal because a bishop protects d7 |

## Evidence levels

- **Verified tactical fact:** legal moves/captures, actual mate/draw, or the bounded exhaustive proof. A legal conditional line does not establish that an opponent must choose it.
- **Engine-supported suggestion:** a legal candidate from a disclosed short search. Rank is not an answer key or strategic proof.
- **Educational interpretation:** a reusable scan of attacks, defenders and replies. Teaching usefulness remains unvalidated.
- **Uncertain assessment:** intentions, conceptual misunderstanding, exchange value and deeper strategy remain unresolved without stronger evidence.

`judgeCandidate` recognizes actual checkmate and reconstructed terminal draws first. For a checking candidate with at most three legal opponent replies, it checks whether every reply permits mate in one and records a line for each defense. It claims only that limited forced mate, not a general tactical solution. Outside those bounds it makes no forced-loss/sacrifice-quality verdict.

The stored `meetsGoal` boolean retains its original literal geometric meaning for compatibility. New policy-versioned judgments override misleading feedback and exclude proven mating moves from weakness prescriptions. En passant is explicit. Old attempts keep missing predictions absent instead of acquiring invented self-reports.

## Actual-engine cross-check

```sh
MARCUS_REAL_ENGINE=1 pnpm exec vitest run src/engine/stockfish.integration.test.ts
```

The installed lite engine runs in a local child process through the same UCI adapter. It checks advertised options, legal responses for every preset and bounded analysis of sacrifice, alternatives and en passant boards. Artifact: `artifacts/phase2b/engine-integration.json`. Browser tests separately exercise the real worker. Node timing is not phone-performance evidence.

The observed sacrifice analysis selected Qg8+, reported mate in two and returned the line independently verified by the exact proof. The proof, rather than the engine’s ranking, supports the claim. Other acceptable moves are not rejected for ranking below one search.
