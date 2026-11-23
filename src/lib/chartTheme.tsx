import React, { useEffect, useState } from 'react';

export interface ChartTheme {
  primary: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  border: string;
  mutedForeground: string;
  surface: string;
  gridStroke: string;
  axisTick: {
    fill: string;
    fontSize: number;
    fontFamily: string;
  };
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(() => getResolvedChartTheme());

  useEffect(() => {
    const update = () => setTheme(getResolvedChartTheme());
    update();

    const observer = new MutationObserver(() => update());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}

export function getResolvedChartTheme(): ChartTheme {
  if (typeof window === 'undefined') {
    // Default to dark Midnight Indigo chart theme
    return {
      primary: 'hsl(248 100% 70%)',
      chart1: 'hsl(248 100% 70%)',
      chart2: 'hsl(171 77% 55%)',
      chart3: 'hsl(43 96% 60%)',
      chart4: 'hsl(330 85% 70%)',
      chart5: 'hsl(205 90% 65%)',
      border: 'hsl(232 25% 17%)',
      mutedForeground: 'hsl(230 20% 66%)',
      surface: 'hsl(232 32% 9%)',
      gridStroke: 'hsl(232 25% 17%)',
      axisTick: {
        fill: 'hsl(230 20% 66%)',
        fontSize: 12,
        fontFamily: 'Geist, sans-serif',
      },
    };
  }

  const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');

  if (isDark) {
    return {
      primary: 'hsl(248 100% 70%)',
      chart1: 'hsl(248 100% 70%)',
      chart2: 'hsl(171 77% 55%)',
      chart3: 'hsl(43 96% 60%)',
      chart4: 'hsl(330 85% 70%)',
      chart5: 'hsl(205 90% 65%)',
      border: 'hsl(232 25% 17%)',
      mutedForeground: 'hsl(230 20% 66%)',
      surface: 'hsl(232 32% 9%)',
      gridStroke: 'hsl(232 25% 17%)',
      axisTick: {
        fill: 'hsl(230 20% 66%)',
        fontSize: 12,
        fontFamily: 'Geist, sans-serif',
      },
    };
  }

  return {
    primary: 'hsl(246 85% 60%)',
    chart1: 'hsl(246 85% 60%)',
    chart2: 'hsl(175 84% 34%)',
    chart3: 'hsl(38 92% 50%)',
    chart4: 'hsl(330 80% 58%)',
    chart5: 'hsl(205 85% 50%)',
    border: 'hsl(227 27% 91%)',
    mutedForeground: 'hsl(230 17% 42%)',
    surface: 'hsl(0 0% 100%)',
    gridStroke: 'hsl(227 27% 91%)',
    axisTick: {
      fill: 'hsl(230 17% 42%)',
      fontSize: 12,
      fontFamily: 'Geist, sans-serif',
    },
  };
}

export function CustomChartTooltip({
  active,
  payload,
  label,
  valueSuffix = '%',
}: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-md p-3 shadow-md text-popover-foreground text-caption animate-scale-in">
      {label && <p className="font-semibold mb-1.5 text-foreground">{label}</p>}
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span className="text-muted-foreground">{entry.name || 'Score'}:</span>
          <span className="font-semibold text-foreground font-mono tabular-nums">
            {entry.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
}
