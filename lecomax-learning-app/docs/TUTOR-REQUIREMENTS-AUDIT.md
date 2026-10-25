# Interactive tutor requirements audit

This audit covers the supplied twelve-mode tutoring specification and the existing implementation, including the follow-up verification controls.

| Requirement | Implementation and boundary |
| --- | --- |
| Twelve intelligence modes | `utils/tutor-contract.ts`, `app/tutor.tsx` and `lib/tutor-workspace.ts` validate, expose and instruct Socratic, beginner, expert, mistake, different explanation, challenge, Feynman, real-world, exam, memory, project and reflection strategies. Provider compliance and teaching accuracy still require live evaluation. |
| Teaching loop | `utils/tutor-coach.ts` gates diagnosis, concept, teach-back, challenge, mastery check and recap on learner responses. Incorrect/partial responses require remediation; uncertain responses do not establish failure. Repeated mistakes return to concept work. |
| Structured internal state | Session goal, coach focus/prerequisites, phase, pending prompt, outcomes, confidence, hints, misconceptions, next exercises and reflection persist through validated progress snapshots. AI assessments are evidence with provenance, not certified mastery. |
| Typed teaching UI | `components/TutorTeachingCard.tsx` renders explanation, question, hint, example, code challenge, quiz, reflection, memory, progress and recommendation turns. Existing quiz, lesson, diagram and roadmap components remain available. |
| Review | Tutor feedback and quizzes connect to Memory Studio. AI feedback cards start due without recording a successful recall. Learners should check generated content before memorizing it. |
| Verification | Code challenges open the executable Interactive Learning Studio rather than the code-reading Practice Lab. An expandable panel links to JavaScript, Python and supported math tools, explains prediction/run/comparison, and recommends checking dated reliable sources for factual claims. Running tools is explicit. Results are not automatically attached or trusted as verified mastery. There is no tutor-side browsing, general theorem prover or autonomous execution. |
| Persistence | Local validated state supports resume and history. Manual cloud controls use the existing authenticated progress API with revision checks. Synthetic browser tests cover save/restore; a real account cloud round trip remains unverified. This is not automatic cloud synchronization. |
| Performance and recovery | Existing streaming, cancellation, draft preservation, retry, bounded context and server auth/rate/budget boundaries remain in use. |
| Learner controls | Session chooser, mode switching, beginner/expert depth, hints, lesson navigation, repeat attempts, reflection and review controls are retained. |
| Evaluation | Regression coverage includes correct/incorrect/uncertain answers, repeated mistakes, prerequisites, depths, interrupted sessions, failed requests, state restoration and evidence integrity. Multilingual browser tests use controlled AI and cloud fixtures; they do not measure actual learning improvement or live translation quality. |

No deployment is part of this change. Native devices, real cloud round trips, live factual accuracy and longitudinal learning gains remain unverified. The current system supports a measurable teaching process; improved educational outcomes require learner studies rather than inference from passing software tests.
