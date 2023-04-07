Documentation is a work in progress.

## Node paradise
Not really, more like a 2am nightmare of barely working ts/js code.  
This repository is a svelte wrapper for litegraph.js to provide history, multiple files, metadata and few more features.  
Design-wise, it is a mostly implemented code base for visual editors of domain specific node-based languages.  
Ideally it is going to be integrated in tauri applications.

### Integration

To have a functional product you will need at least:
- To define proper custom nodes.
- To provide fs operations in the backend, so that files can be actually stored somewhere.

At the moment only the *editor* section is implemented. The other sections are just placeholders.

### Dependencies
It is based on a custom version of [litegraph.js](https://github.com/KaruroChori/litegraph.js) since I had to do some bugfixing to work.  
