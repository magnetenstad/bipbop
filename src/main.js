import { Directory } from 'virtual-file-system'
import { compileBipToJavaScript } from './bip.js'

const dir = Directory.read('bip-src')

dir.apply((file) => {
  file.name = file.name.replace('.bip', '.js')
  file.data = compileBipToJavaScript(file.data)
})

dir.writeContents('bip-dest')

