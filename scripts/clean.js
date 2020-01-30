const removeRecursive = require('../../scandit-cordova-datacapture-core/scripts/remove-recursive')

const clean = () => {
    removeRecursive('./www/js')
    removeRecursive('./coverage')
}

clean()
