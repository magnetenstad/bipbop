import { Directory } from 'virtual-file-system'
import { runBip } from './bip2.js'
import { argv } from 'process';

const dir = Directory.read('bip-src')

dir.apply((file) => {
  if (file.name.includes('.bip') && file.name.match(argv[2])) {
    console.log(`Running ${file.name}\n`)
    runBip(file.data)
    console.log(`\nFinished running ${file.name}\n`)
  }
})
