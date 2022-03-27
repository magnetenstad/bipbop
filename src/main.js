import { Directory } from 'virtual-file-system'
import { compileBipToJson } from './bip.js'

const dir = Directory.read('bip-src')

dir.apply((file) => {
  file.name = file.name.replace('.bip', '.js')
  file.data = compileBipToJson(file.data)
})

dir.writeContents('bip-dest')

