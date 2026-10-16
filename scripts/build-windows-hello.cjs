const { execFileSync } = require('node:child_process');
const path = require('node:path');
if (process.platform !== 'win32') throw Error('Build Windows Hello on Windows with Visual Studio C++ tools and the Windows SDK.');
const root = path.resolve(__dirname, '..'), pkg = require('../package.json');
execFileSync(process.execPath, [require.resolve('node-gyp/bin/node-gyp.js'), 'rebuild',
 '--directory=' + path.join(root, 'native', 'windows-hello'), '--target=' + pkg.devDependencies.electron,
 '--arch=x64', '--dist-url=https://electronjs.org/headers'], { cwd: root, stdio: 'inherit' });
