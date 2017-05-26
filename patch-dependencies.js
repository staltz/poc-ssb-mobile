const glob = require('glob')
const fs = require('fs')
const path = require('path')

const ROOT_PATH = path.resolve(`${__dirname}`)

// Get paths to all readable-stream packages in the dependency tree
function getPackagePaths(rootPath, packageName) {
  return glob.sync(`${rootPath}/**/node_modules/${packageName}`)
}

// Get paths a package's JavaScript source files, not including dependencies
function getPackageSourceFiles(packagePath) {
  return glob.sync(`${packagePath}/**/*.js`, {
    ignore: 'node_modules',
  })
}

function patchAllFilesWith(moduleName, patchFn) {
  console.log('Patching', moduleName, '...')
  // Get source files of all `moduleName` packages in the dependency tree
  getPackagePaths(ROOT_PATH, moduleName).forEach((packagePath) => {
    getPackageSourceFiles(packagePath).forEach((sourceFilePath) => {
      // Read the source file and patch it
      const content = fs.readFileSync(sourceFilePath, 'utf8')
      const patched = patchFn(content, sourceFilePath)
      // If the file content is changed, write to the file
      if (content !== patched) {
        const relPath = path.relative(ROOT_PATH, sourceFilePath)
        console.log(' =>', relPath)
        fs.writeFileSync(sourceFilePath, patched, 'utf8')
      }
    })
  })
  console.log('  done.')
}

// The readable-stream package calls require() in a way that will cause
// the call to throw an exception when using Webpack or Browserify.
//
//     require('st' + 'ream')
//
// This case is handled: the module catches the exception and continues.
// However, when using React Native Packer, the require() call does not throw
// an exception and instead returns an empty object ({}), causing the module
// to eventually throw an error and crash the program.
//
// This function replaces these calls with an inline function that throws an
// error, like module expects.
//
// Other cases like this might happen, such as require('pa' + 'th') in the
// `vfile` module.

patchAllFilesWith('readable-stream', content =>
  content.replace(
    /Stream = require\('st' ?\+ ?'ream'\)/g,
    `throw new Error('readable-stream called require(st + ream)')`
  ).replace(
    /(return )?require\('st' ?\+ ?'ream'\)/g,
    `throw new Error('readable-stream called require(st + ream)')`
  )
)
