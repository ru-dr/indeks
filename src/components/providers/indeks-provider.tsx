'use client';

import { Indeks, IndeksDebugger } from '@indeks/react';

export default function IndeksProvider() {
  return (
    <Indeks
      apiKey={process.env.NEXT_PUBLIC_INDEKS_PROJECT_KEY!}
      enableConsoleLogging={true}
      
      config={{
        captureMouseHover: false,
        captureMouseWheel: false,
        captureClicks: true,
        captureNetworkStatus: true,
        localOnly: false
      }}
    >
      <IndeksDebugger  />
    </Indeks>
  );
}