import { useCollabStore } from './collabStore'
import { leaveSession } from './collabSession'

export function CollabStatusBadge() {
  const role = useCollabStore((s) => s.role)
  const status = useCollabStore((s) => s.status)
  const roomCode = useCollabStore((s) => s.roomCode)
  const peerCount = useCollabStore((s) => Object.keys(s.peers).length)

  if (role === 'solo') return null

  const label =
    role === 'host'
      ? status === 'connected'
        ? `Host (${roomCode}) · ${peerCount} Mitarbeiter online`
        : `Host (${roomCode}) · warte auf Mitarbeiter…`
      : status === 'connected'
        ? 'Mitarbeiter · verbunden'
        : 'Mitarbeiter · verbinde…'

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
      {label}
      <button
        onClick={() => {
          const confirmed = window.confirm(
            role === 'host' ? 'Sitzung für alle Mitarbeiter beenden?' : 'Diese Sitzung verlassen?',
          )
          if (confirmed) leaveSession()
        }}
        className="ml-1 text-slate-400 hover:text-red-500"
        title={role === 'host' ? 'Sitzung beenden' : 'Sitzung verlassen'}
      >
        ✕
      </button>
    </div>
  )
}
