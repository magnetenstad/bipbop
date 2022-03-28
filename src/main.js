import { Directory } from 'virtual-file-system'
import { bipToJs } from './bip.js'

const dir = Directory.read('bip-src')

dir.apply((file) => {
  file.name = file.name.replace('.bip', '.js')
  file.data = bipToJs(file.data)
})

dir.writeContents('bip-dest')

