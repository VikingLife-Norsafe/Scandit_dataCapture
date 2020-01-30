module.exports = function (context) {
  let projectRoot = context.cordova.findProjectRoot()
  let corePlugin = `${projectRoot}/plugins/scandit-cordova-datacapture-core`
  let addFrameworks = require(`${corePlugin}/src/hooks/add-frameworks`);
  return addFrameworks(context);
}
