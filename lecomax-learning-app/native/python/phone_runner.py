"""Real CPython execution in the disposable Android Python service process."""
import contextlib
import io
import json
import sys
import time
import traceback


class BoundedOutput(io.StringIO):
    def __init__(self, fail_on_limit=True):
        super().__init__()
        self.truncated = False
        self.fail_on_limit = fail_on_limit

    def write(self, text):
        remaining = max(0, 24000 - self.tell())
        if len(text) > remaining:
            self.truncated = True
        super().write(text[:remaining])
        if self.truncated and self.fail_on_limit:
            raise RuntimeError("Output limit reached (24000 characters)")
        return len(text)


def run(code, stdin):
    output, errors = BoundedOutput(), BoundedOutput(False)
    started = time.monotonic()
    old_stdin = sys.stdin
    exit_code = 0
    try:
        sys.stdin = io.StringIO(stdin)
        with contextlib.redirect_stdout(output), contextlib.redirect_stderr(errors):
            try:
                exec(compile(code, "lesson.py", "exec"), {"__name__": "__main__"})
            except BaseException:
                exit_code = 1
                traceback.print_exc(limit=12)
    finally:
        sys.stdin = old_stdin
    return json.dumps({"stdout": output.getvalue(), "stderr": errors.getvalue()[-24000:],
                      "exitCode": exit_code, "durationMs": int((time.monotonic() - started) * 1000),
                      "timedOut": False, "cancelled": False, "truncated": output.truncated or errors.truncated,
                      "version": sys.version.split()[0], "engine": "CPython on Android"})
