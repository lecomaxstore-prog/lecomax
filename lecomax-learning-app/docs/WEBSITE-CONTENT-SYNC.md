# Website lessons in Learn

The app bundles content from the workspace's `app/admin/how-it-was-built` and related educational source files for offline use. It does not automatically fetch live website changes or copy the user's website progress.

On the home screen, choose **How my site was built → Open website courses**. This opens the original academy modules in website order. Other imported beginner, daily, studio, shop, Code Quest, micro-learning and reference material remains available through Path and Search.

The 7 October 2026 refresh maps 583 explicit website lessons with zero missing records. The academy contains 48 modules and 192 lessons. Each academy lesson's complete source object is preserved and compared for deep equality in Arabic, English and French. Its original sections, paragraphs, callouts, vocabulary, lists and annotated code render in their original order; objectives, prerequisites, commands, expected results and troubleshooting are also displayed. Exercises, quizzes and recaps remain available in the lesson tabs.

Refresh after changing website teaching content:

```powershell
npm.cmd run content
npm.cmd run content:verify
npm.cmd test
```

`docs/LESSON-COMPARISON.md` lists individual mappings. Mapped records outside the academy are adapted for the mobile lesson model; their presence does not assert an identical website layout. Reference and archive entries are not counted as additional authored lessons. Existing app lesson IDs are retained so saved app progress and notes remain associated with their lessons.

The running localhost preview receives these changes. An already installed APK requires a new build to receive the refreshed bundle.
