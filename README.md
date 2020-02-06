# angelscripts-k8s-development

[organic-angel](https://github.com/node-organic/organic-angel) scripts for development within k8s clusters.

Works with [angelscripts-dockerbuild](https://github.com/node-organic/angelscripts-dockerbuild).

## prerequirements

* `kubectl`
* `angelscripts-dockerbuild`

## setup

```
$ npm i angelscripts-k8s-development --save
$ edit dna/cells/my-cell/development.yaml
```

### usage

Notes:

* `namespace` value if not provided will be sourced from `process.env.USER` variable.

#### example

```
$ cd ./my-stem-skeleton-2-1-based-project
$ cd ./cells/myCell
$ angel k8sd up -- nodemon index.js
$ angel k8sd down
```

The above example will start `myCell` for development by building its base image of dependencies and its staged in git source code.

It will use `cells.myCell.development` as k8s configuration to bootstrap (or seek existing) deployment. 

The container will be started with command `nodemon index.js` within namespace with value of `process.env.USER`.


#### `angel k8sd up :namespace :branchName -- :runCMD`

Creates (or re-uses) a k8s deployment within `namespace` using `branchName` to drain k8s configuration from the current working cell dna.

Stopping the command doesn't stops the container.
The command starts (and stops when stopped) local synchronizer and logs streaming.

#### `angel k8sd down :namespace :branchName`

Stops already running container via `angel k8sd up`

#### `angel k8sd enter :namespace`

Enters as remote bash session within already running container via `angel k8sd up`.

#### `angel k8sd start :namespace :branchName`

Applies given `cells.<cell>.<branchName>` at k8s and uses imageTag without namespace applied. 

This is useful to bootstrap latest production released containers within the development `namespace` with development mode applied.

#### `angel k8sd delete :namespace :branchName`

Deletes given `cells.<cell>.<branchName>` from k8s.

#### `angel k8sd exec :namespace -- :runCMD`

Executes `runCMD` at k8s running container within `namespace`

#### `angel k8sd logs :namespace`

Prints last 10 lines and streams the respective container logs from the cell

#### `angel k8sd sync :namespace`

Monitors for file changes within the repo's `cells/node_modules` and current working cell directories and uploads any to respective container at k8s.

#### `angel k8sd buildbase :branchName :namespace`

Creates a base container image using `angel buildbase` script from `angelscripts-dockerbuild`.

This is used by `angel k8sd up` as base layer to bootstrap respective cell without installing any of its depdencies.

#### `angel k8sd reversetunnel :namespace -- :runCmd`

Uses current working `cell.dna.development` branch to create a deployment (and optionally service) having `datawire/telepresence-k8s:0.104` image set.

Once the deployment is running establishes reverse tunnel to its pod via `telepresence` (expected to be pre-installed).