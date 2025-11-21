'use client';

import { Indeks, IndeksDebugger } from '@indeks/react';

export default function IndeksProvider() {
  return (
    <Indeks
      apiKey={process.env.NEXT_PUBLIC_INDEKS_PROJECT_KEY!}
      enableConsoleLogging={true}
      config={{
        captureMouseHover: true,
        captureClicks: true,
        captureNetworkStatus: true,
      }}
    >
      <IndeksDebugger />
    </Indeks>
  );
}