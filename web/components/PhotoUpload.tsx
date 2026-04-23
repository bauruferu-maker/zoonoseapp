'use client'
import { useState, useRef } from 'react'
import { createClient } from '../lib/supabase-browser'

interface PhotoUploadProps {
  name: string
  initialUrl?: string
  agentId: string
}

export default function PhotoUpload({ name, initialUrl, agentId }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string>(initialUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${agentId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('visit-photos')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('visit-photos')
        .getPublicUrl(path)

      setUploadedUrl(publicUrl)
    } catch {
      setError('Erro ao enviar foto. Tente novamente.')
      setPreview(initialUrl ?? null)
      setUploadedUrl(initialUrl ?? '')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={uploadedUrl} />

      {preview && (
        <div className="mb-3 relative w-48 h-36 rounded-xl overflow-hidden border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Foto da visita" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
      >
        {uploading ? 'Enviando...' : preview ? 'Trocar foto' : '+ Adicionar foto'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}
