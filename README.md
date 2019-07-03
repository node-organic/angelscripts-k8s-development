# angelscripts-k8s-development

[organic-angel](https://github.com/node-organic/organic-angel) scripts for development within k8s clusters.

:warning: Experimental

## setup

```
$ npm i angelscripts-k8s-development --save
$ cd dna/cells/my-cell
$ touch development.yaml
```

### how it works

* reads `development.yaml` found under the current working stem cell, passing values for:
  * `CELLDEVCMD` - what dev command should be used to start the container
  * `REPOBRANCH` - name of the repo branch currently working at
  * `CELLVERSION` - cell's version from `package.json`

### usage

#### `angel k8s :devCmd`
