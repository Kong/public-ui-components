# Analytics rendering

For application consumers, render analytics through `DashboardRenderer` for a
layout of tiles or `DashboardTilePreview` for one embedded tile. These components
own query execution, readiness, filters, loading/error states, and rendering.

Do not introduce direct `AnalyticsChart` imports or rendering in application
code. A direct use is permitted only when a required capability cannot be
implemented through either supported entry point. First investigate extending
the shared renderer; document the concrete blocker and the smallest necessary
exception in the PR. Custom layout, convenience, or avoiding the query bridge
do not justify an exception.

The renderer's internal use of `AnalyticsChart`, tests of the primitive, and
sandbox examples that document its low-level contract are outside this
consumer restriction. Keep the distinction clear in public examples.

See the [consumer entry points](./dashboard-renderer/README.md#consumer-entry-points)
for setup and a single-tile example. Runtime contracts remain defined by source
and types; this rule does not remove or deprecate the primitive's public API.
