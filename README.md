# angelscripts-k8s-development

[organic-angel](https://github.com/node-organic/organic-angel) scripts for development within k8s clusters.

Works with [angelscripts-dockerbuild](https://github.com/node-organic/angelscripts-dockerbuild).

## prerequirements

* `kubectl`

## setup

```
$ npm i angelscripts-k8s-development --save
$ edit dna/cells/my-cell/development.yaml
```

### usage

Notes:

* `namespace` value if not provided will be sourced from `process.env.USER` variable.

#### `angel k8sd up :namespace :branchName -- :runCMD`

Creates (or re-uses) a k8s deployment within `namespace` using `branchName` to drain k8s configuration from the current working cell dna.

example:

```
$ cd ./my-stem-skeleton-2-1-based-project
$ cd ./cells/myCell
$ angel k8sd up myNamespace development -- nodemon index.js
```

The above example will load the project's dna and will use `cells.myCell.development` as k8s configuration to bootstrap (or seek existing) deployment with entry point `nodemon index.js`

Stopping the command doesn't stops the container.
The command starts (and stops when stopped) local synchronizer and logs streaming.

#### `angel k8sd down :namespace :branchName`

Stops already running container via `angel k8sd up`

#### `angel k8sd enter :namespace`

Enters as remote bash session within already running container via `angel k8sd up`.

#### `angel k8sd apply :namespace :branchName`

Applies given `cells.<cell>.<branchName>` at k8s.

#### `angel k8sd delete :namespace :branchName`

Deletes given `cells.<cell>.<branchName>` from k8s.

#### `angel k8sd exec :namespace -- :runCMD`

Executes `runCMD` at k8s running container within `namespace`

#### `angel k8sd logs :namespace`

Prints last 10 lines and streams the respective container logs from the cell

#### `angel k8sd sync :namespace`

Monitors for file changes within the repo's `cells/node_modules` and current working cell directories and uploads any to respective container at k8s.
