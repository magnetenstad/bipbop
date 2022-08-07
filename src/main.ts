// @ts-ignore
import { Directory, File } from 'virtual-file-system'
import { runBip } from './parse.js'
import { argv } from 'process'

const dir = Directory.read('bip-src')

dir.apply((file: File) => {
  if (
    file.name.includes('.bip') &&
    (file.location + file.name).match(argv[2])
  ) {
    console.log(`Running ${file.name}\n`)
    runBip(file.data)
    console.log(`\nFinished running ${file.name}\n`)
  }
})
