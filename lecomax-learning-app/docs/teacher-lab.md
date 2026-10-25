# Teacher practice lab

Start the local API from the repository root:

```powershell
node scripts/start-teacher-lab.mjs
```

Start the app in another terminal:

```powershell
cd lecomax-learning-app
npm.cmd run web -- --localhost
```

Use http://localhost:8081 and sign in. The learning app's local
`EXPO_PUBLIC_LEARNING_API_URL` must point to `http://127.0.0.1:3002`.
Stop an older API server on port 3002 before starting the lab server.

The Teacher has a Practice lab button and JavaScript/Python/PowerShell code blocks
have an Open in practice lab action. Loading code never executes it. Review
the code, acknowledge its effects and press Run. Output, errors, exit code
and elapsed time come from the actual process. Explain the result prepares
a chat draft for review; sending it shares that code and output with the AI.
Do not send secrets in output.

This is a real local command console, **not an OS sandbox**. Code runs with
the server user's file/network permissions. A fresh temporary working
directory and a minimal environment prevent accidental inheritance of app
secrets; they do not stop code from reading other accessible files. Run only
code you understand. Temporary working directories remain in the OS temp
folder for inspection. Processes have a 10-second limit, bounded output,
and no interactive stdin. Each run is independent; variables and working
directory changes do not carry over. This is not a persistent terminal/PTY.

Node.js runs standalone CommonJS JavaScript, not JSX, DOM code, TypeScript,
or SQL. Python 3 runs standalone scripts and standard-library examples, with
UTF-8 output, tracebacks and the same execution limits. Interactive `input()`,
GUI apps and notebooks are not supported. The launcher resolves the installed
Python interpreter; `LECOMAX_PYTHON_EXECUTABLE` can override its path. Python
runs with `-I` to ignore Python environment customization and user packages;
this is interpreter isolation, not a security sandbox. Windows PowerShell uses the existing Windows installation;
no package or machine execution-policy change is needed. The endpoint
requires an authenticated owner, explicit launcher opt-in, an HTTP loopback
host and a loopback web origin on port 8081. It is disabled in production.
Native/mobile remote execution is intentionally unavailable.

The teacher explains goals, predictions, runnable examples, expected output,
line-by-line reasons, mistakes and one follow-up experiment. It has no direct
execution tool and must not claim to have run its examples. Actual output
is shown only after the learner executes the example.
