import { useCollabStore } from './collabStore'

export function PresenceDots({ slideId }: { slideId: string }) {
  const peers = useCollabStore((s) => s.peers)
  const viewers = Object.entries(peers).filter(([, info]) => info.viewingSlideId === slideId)

  if (viewers.length === 0) return null

  return (
    <div className="absolute left-0.5 top-0.5 flex gap-0.5">
      {viewers.map(([peerId, info]) => (
        <span
          key={peerId}
          className="h-2.5 w-2.5 rounded-full ring-1 ring-white"
          style={{ backgroundColor: info.color }}
          title={info.role === 'host' ? 'Host schaut hier' : 'Mitarbeiter schaut hier'}
        />
      ))}
    </div>
  )
}
