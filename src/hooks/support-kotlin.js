module.exports = function (context) {
  let projectRoot = context.cordova.findProjectRoot()
  let corePlugin = `${projectRoot}/plugins/scandit-cordova-datacapture-core`
  let supportKotlin = require(`${corePlugin}/src/hooks/support-kotlin`);
  return supportKotlin(context);
}
