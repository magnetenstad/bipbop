import { Directory } from 'virtual-file-system'
import { runBip } from './bip.js'

const dir = Directory.read('bip-src')

dir.apply((file) => {
  console.log(`Running ${file.name}`)
  runBip(file.data)
})
