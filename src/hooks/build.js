module.exports = function (context) {
  let projectRoot = context.cordova.findProjectRoot()
  let corePlugin = `${projectRoot}/plugins/scandit-cordova-datacapture-core`
  let build = require(`${corePlugin}/src/hooks/build`);
  return build(context);
}
