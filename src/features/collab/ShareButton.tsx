import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { useCollabStore } from './collabStore'
import { startHosting } from './collabSession'

function joinUrlFor(roomCode: string): string {
  return `${window.location.origin}${window.location.pathname}?join=${roomCode}`
}

function QrJoinModal({ roomCode, onClose }: { roomCode: string; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const joinUrl = joinUrlFor(roomCode)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(joinUrl, { width: 240, margin: 1 }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [joinUrl])

  return (
    <Modal onClose={onClose}>
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-bold text-slate-900">Mitarbeiter einladen</h2>
        <p className="text-sm text-slate-500">
          Lass deinen Mitarbeiter diesen QR-Code scannen, oder teile den Link. Er landet direkt im selben Projekt und
          sieht deine Änderungen live.
        </p>
        <div className="flex justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR-Code zum Beitreten" className="h-60 w-60 rounded-lg border border-slate-200" />
          ) : (
            <div className="h-60 w-60 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={joinUrl}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600"
          />
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(joinUrl)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? 'Kopiert!' : 'Kopieren'}
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Funktioniert nur, wenn diese Seite über eine für beide erreichbare Adresse geöffnet ist (z.B. die
          veröffentlichte Live-Demo-URL), nicht über einen lokalen Entwicklungsserver.
        </p>
      </div>
    </Modal>
  )
}

export function ShareButton() {
  const role = useCollabStore((s) => s.role)
  const roomCode = useCollabStore((s) => s.roomCode)
  const [modalOpen, setModalOpen] = useState(false)

  function handleClick() {
    startHosting()
    setModalOpen(true)
  }

  return (
    <>
      {role === 'solo' && (
        <Button variant="ghost" className="shrink-0" onClick={handleClick}>
          👥 Zusammenarbeiten
        </Button>
      )}
      {modalOpen && roomCode && <QrJoinModal roomCode={roomCode} onClose={() => setModalOpen(false)} />}
    </>
  )
}
