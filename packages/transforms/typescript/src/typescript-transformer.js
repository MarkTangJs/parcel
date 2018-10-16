const localRequire = require('@parcel/utils/localRequire');
const config = require('@parcel/utils/config');

exports.getConfig = async function(module, options) {
  return config.load(module.filePath, ['tsconfig.json']);
};

exports.transform = async function(module, tsconfig, options) {
  let typescript = await localRequire('typescript', module.filePath);
  let transpilerOptions = {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.Preserve,

      // it brings the generated output from TypeScript closer to that generated by Babel
      // see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html
      esModuleInterop: true
    },
    fileName: module.relativePath
  };

  // Overwrite default if config is found
  if (tsconfig) {
    transpilerOptions.compilerOptions = Object.assign(
      transpilerOptions.compilerOptions,
      tsconfig.compilerOptions
    );
  }
  transpilerOptions.compilerOptions.noEmit = false;
  transpilerOptions.compilerOptions.sourceMap = options.sourceMaps;

  let transpiled = typescript.transpileModule(
    module.code,
    transpilerOptions
  );

  let sourceMap = transpiled.sourceMapText;
  let code = transpiled.outputText;
  if (sourceMap) {
    sourceMap = JSON.parse(sourceMap);
    sourceMap.sources = [module.relativePath];
    sourceMap.sourcesContent = [module.code];

    // Remove the source map URL
    code = code.substring(
      0,
      code.lastIndexOf('//# sourceMappingURL')
    );
  }

  return [{
    type: 'js',
    blobs: {
      code: code,
      map: sourceMap || null
    }
  }];
}