'use client';

import { useCallback, useEffect, useState } from 'react';
import { CirclesList } from './CirclesList';
import { CircleDetail } from './CircleDetail';
import { listMyCircles } from '@/lib/circles/queries';
import type { CircleSummary } from '@/lib/circles/types';

type View = { kind: 'list' } | { kind: 'detail'; circleId: string };

export function CirclesTab() {
  const [view, setView] = useState<View>({ kind: 'list' });
  const [circles, setCircles] = useState<CircleSummary[] | null>(null);

  const refresh = useCallback(async () => {
    setCircles(await listMyCircles());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (view.kind === 'detail') {
    return (
      <CircleDetail
        circleId={view.circleId}
        onBack={() => setView({ kind: 'list' })}
        onLeft={() => {
          setView({ kind: 'list' });
          refresh();
        }}
      />
    );
  }

  return (
    <CirclesList
      circles={circles}
      onSelect={(id) => setView({ kind: 'detail', circleId: id })}
      onMutated={refresh}
    />
  );
}
