# Workflows

**Warning**: No data is saved on storage at this stage. The server endpoints are not writing files.

This workspace offers a node-based editor to:

- Define reusable library components.
- Build custom _brushes_ to be used in the _canvas workspace_.
- Construct automatic tasks, whose output will be in the _tasks workspace_

The interface and the language offered is the same for all tree.
It is possible that future versions of this workspace will also include direct coding capabilities in TS, fully matching the supported nodes.

## Toolbars

There are two toolbars in this workspace:

- The top one will offer contextual buttons and information related to the graph currently open. On the right there are also the global navigation buttons.
- The bottom one provides all the global information for the workspace, like opened files, and buttons to create new or managing the remote target repository.

## Shortcuts

Implemented:

- `CTRL+L_ARROW`: Move to previous file
- `CTRL+R_ARROW`: Move to next file
- `CTRL+S`: Save currrent file
- `CTRL+SHIF+S`: Save all open files
- `CTRL+SHIFT+L_ARROW`: Move the file to previous spot in the list
- `CTRL+SHIFT+R_ARROW`: Move the file to the next spot in the list
- `F2`: Rename current file
- `CTRL+Z`: Undo
- `CTRL+SHIFT+Z`: Redo

Planned:

- `DEL` cancel selected nodes
- `CTRL+V` paste
- `CTRL+C` copy

## TODO

- [x] Persistence of state while routing
- [ ] Complete the missing keyboard shortcuts
- [ ] Clean up the dialog windows
- [ ] Review tRPC functions and provide fs support.
- [ ] Isomorphic GIT to allow repositories.
- [ ] Include the final comfyui nodes, and not the placeholder ones
