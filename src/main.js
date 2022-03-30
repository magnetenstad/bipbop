import { Directory } from 'virtual-file-system'
import { runBip } from './bip.js'

const dir = Directory.read('bip-src')

dir.apply((file) => {
  if (file.name.includes('.bip')) {
    console.log(`Running ${file.name}\n`)
    runBip(file.data)
    console.log(`\nFinished running ${file.name}\n`)
  }
})
