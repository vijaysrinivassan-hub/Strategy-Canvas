# Universal keyword columns

Settings → Universal keyword columns defines the owner's Category, Competitor, ICP and Value templates. Names, AI instructions, channel, default article type (a dropdown from Settings → Article Types, stored by name across products) and awareness are editable. Save explicitly; conflicting settings edits are rejected.

The existing reports store holds one internal settings record per owner, protected by the existing owner-only write policies. The record is excluded from client lists and MCP board_list. No schema, policy or public credential changes are required.

New clients/products inherit templates. Existing matching legacy headings retain their column IDs and cell data; prior local guidance is retained in previousLocalSettings when a definition takes ownership. Explicitly local columns are never adopted merely because names match. Template updates apply when owners open/use a table or save a board, and MCP reads resolve the owner's current template. Saved snapshots are available to read-only client viewers; owners should save after changing templates to publish refreshed snapshots.

Universal columns show a lock and cannot be renamed or deleted in Keywords. Add columns there for product-local customisation. Cell-level content and overrides remain editable. Left/right controls reorder all columns, including the Competitor name column. Order is product-specific and saved. Universal settings order seeds new products; existing product order is retained.

Removing a universal definition in Settings unlocks existing copies as local columns, preserving keyword data; it stops inheritance for new products. The structural Competitor name definition cannot be removed.

Tests: node test-universal-columns.mjs; node test-keyword-column-rename.mjs; node test-product-workspaces.mjs.
