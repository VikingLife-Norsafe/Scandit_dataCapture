const removeRecursive = require('../../scandit-cordova-datacapture-core/scripts/remove-recursive')

const cleanAll = () => {
    removeRecursive('./node_modules')
}

cleanAll()
