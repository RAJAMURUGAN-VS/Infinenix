export function SkeletonMessages() {
  const skeletons = [
    { align: 'left',  width: 'w-2/3' },
    { align: 'right', width: 'w-1/2' },
    { align: 'left',  width: 'w-3/4' },
    { align: 'right', width: 'w-2/5' },
  ];

  return (
    <div className="flex flex-col gap-4 p-6 max-w-4xl mx-auto w-full">
      {skeletons.map((s, i) => (
        <div
          key={i}
          className={`flex ${s.align === 'right' ? 'justify-end' : 'justify-start'}`}
        >
          {s.align === 'left' && (
            <div className="w-9 h-9 rounded-full bg-muted animate-pulse mr-3 flex-shrink-0 mt-1" />
          )}
          <div
            className={`${s.width} h-14 rounded-2xl bg-muted animate-pulse`}
          />
        </div>
      ))}
    </div>
  );
}
