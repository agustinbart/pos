import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ isOpen, onClose, onDetected }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    let active = true

    reader
      .decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result && active) {
          active = false
          onDetected?.(result.getText())
          reader.reset()
          onClose?.()
        }
        // Ignorar errores intermitentes mientras no haya resultado
        if (err && err.name !== 'NotFoundException') {
          console.error('Scanner error:', err)
        }
      })
      .catch((err) => {
        console.error('Camera access error:', err)
        onClose?.()
      })

    return () => {
      active = false
      reader.reset()
    }
  }, [isOpen, onClose, onDetected])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 px-4">
      <div className="relative w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-4">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-300 hover:bg-gray-800"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-3 text-center">
          <h2 className="text-xl font-semibold text-white">Escanear código de barras</h2>
          <p className="text-sm text-gray-400">Apunta la cámara al código de barras del producto</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-700">
          <video
            ref={videoRef}
            className="h-72 w-full bg-black object-cover"
            autoPlay
            muted
            playsInline
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Si no ves la cámara, otorga permisos o prueba desde HTTPS / localhost.
        </p>
      </div>
    </div>
  )
}
