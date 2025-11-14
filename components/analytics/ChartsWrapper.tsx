"use client";

import dynamic from "next/dynamic";
import { EngagementChart, PlatformChart, PlatformDistribution, FollowersTrend } from "./Charts";

export const EngagementChartClient = dynamic(
  () => Promise.resolve({ default: EngagementChart }),
  { ssr: false }
);

export const PlatformChartClient = dynamic(
  () => Promise.resolve({ default: PlatformChart }),
  { ssr: false }
);

export const PlatformDistributionClient = dynamic(
  () => Promise.resolve({ default: PlatformDistribution }),
  { ssr: false }
);

export const FollowersTrendClient = dynamic(
  () => Promise.resolve({ default: FollowersTrend }),
  { ssr: false }
);

