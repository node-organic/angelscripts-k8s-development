# angelscripts-k8s-development

[organic-angel](https://github.com/node-organic/organic-angel) scripts for development within k8s clusters.

Works with [angelscripts-dockerbuild](https://github.com/node-organic/angelscripts-dockerbuild).

## prerequirements

* `kubectl`
* [devspace](https://github.com/devspace-cloud/devspace)

## setup

```
$ npm i angelscripts-k8s-development --save
$ edit dna/cells/my-cell/development.yaml
```

### usage

#### `angel k8sd up :namespace :branchName -- :runCMD`
#### `angel k8sd down :namespace :branchName`
#### `angel k8sd enter :namespace`
#### `angel k8sd apply :namespace :branchName`
#### `angel k8sd delete :namespace :branchName`
