# Admin loading fixes — 13 October 2026

The Analytics page previously waited for both the selected period and a second,
overlapping report before displaying its statistics. Failed HTTP, JSON or network
reads could leave the loading skeleton visible indefinitely. Its previous-period
request also downloaded visitor details and grouped sessions it did not use.

The current report now renders first. Comparison totals load afterward through a
compact, authenticated API response. A comparison failure leaves trends unavailable
instead of presenting a false zero. Main-report failures show a retry button.
Requests have deadlines; switching periods cancels obsolete work and stale responses
cannot replace the selected report. Background activity polling pauses in hidden tabs.

The persistent admin shell delays optional badge requests by 1.5 seconds and refreshes
them once per minute, rather than downloading five lists on every route transition.
Badge requests have ten-second deadlines. Authentication and permission HTTP reads
have eight-second deadlines; their existing authorization checks and fallback remain.

The Analytics API retains its existing 5,000-row query limits. These reports are not
an unlimited historical aggregation. Badge updates may take up to a minute to reflect
changes elsewhere. These changes do not reduce database latency or guarantee a fixed
page-load time on every device.

A read-only request to the live homepage returned HTTP 200, 53,352 compressed bytes,
2.517833 seconds to first byte and 3.046213 seconds total. This is a single observation
of the existing deployment, not a browser performance score or a post-fix measurement.
The earlier storefront image, content-visibility and deferred-request improvements
remain in the workspace. A production deployment and subsequent phone checks are
required to verify the combined changes on lecomax.com.

Runtime regressions cover HTTP/JSON failure, response-body timeout, cancellation,
retry, current-report rendering before comparison completion, stale responses,
compact summary projections, revenue calculation and authorization. The immutable
linked Change History follow-up records the actual final validation results.
