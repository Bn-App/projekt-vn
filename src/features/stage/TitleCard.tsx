export function TitleCard({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-8">
      <p className="max-w-[85%] whitespace-pre-line text-center text-3xl font-bold uppercase tracking-wide text-white drop-shadow-lg sm:text-4xl">
        {text || 'Titel eingeben…'}
      </p>
    </div>
  )
}
