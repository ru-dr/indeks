"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Cobe } from "@/components/ui/cobe-globe";
import {
  Users,
  TrendingUp,
  Globe,
  MapPin,
  Activity,
  Clock,
  LayoutDashboard,
  LineChart,
  DollarSign,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RealtimeTrafficPage() {
  const getCountryFlag = (countryName: string): string => {
    const countryToCode: Record<string, string> = {
      "United States": "US",
      "United Kingdom": "GB",
      Germany: "DE",
      France: "FR",
      Canada: "CA",
      Australia: "AU",
      Japan: "JP",
      China: "CN",
      India: "IN",
      Brazil: "BR",
      Mexico: "MX",
      Spain: "ES",
      Italy: "IT",
      Netherlands: "NL",
      Sweden: "SE",
      Norway: "NO",
      Denmark: "DK",
      Finland: "FI",
      Poland: "PL",
      Russia: "RU",
      "South Korea": "KR",
      Singapore: "SG",
      Indonesia: "ID",
      Thailand: "TH",
      Vietnam: "VN",
      Philippines: "PH",
      Malaysia: "MY",
      Argentina: "AR",
      Chile: "CL",
      Colombia: "CO",
      "South Africa": "ZA",
      Egypt: "EG",
      Nigeria: "NG",
      Kenya: "KE",
      Turkey: "TR",
      "Saudi Arabia": "SA",
      "United Arab Emirates": "AE",
      Israel: "IL",
      Pakistan: "PK",
      Bangladesh: "BD",
      "New Zealand": "NZ",
      Portugal: "PT",
      Greece: "GR",
      "Czech Republic": "CZ",
      Austria: "AT",
      Switzerland: "CH",
      Belgium: "BE",
      Ireland: "IE",
      Romania: "RO",
      Ukraine: "UA",
    };

    const countryCode = countryToCode[countryName];
    if (!countryCode) return "🌍";

    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const realtimeStats = [
    {
      label: "Active Users",
      value: "1,234",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-[var(--color-indeks-blue)]",
    },
    {
      label: "Page Views/Min",
      value: "856",
      change: "+8%",
      trend: "up",
      icon: Activity,
      color: "text-[var(--color-indeks-green)]",
    },
    {
      label: "Avg. Session",
      value: "4m 32s",
      change: "-2%",
      trend: "down",
      icon: Clock,
      color: "text-[var(--color-indeks-yellow)]",
    },
    {
      label: "Active Countries",
      value: "48",
      change: "+5",
      trend: "up",
      icon: Globe,
      color: "text-[var(--color-indeks-orange)]",
    },
  ];

  const topLocations = [
    {
      country: "United States",
      users: 456,
      percentage: 37,
      sessions: 892,
      avgSession: "4m 23s",
      bounceRate: "28%",
      growth: "+12%",
    },
    {
      country: "United Kingdom",
      users: 234,
      percentage: 19,
      sessions: 445,
      avgSession: "3m 45s",
      bounceRate: "32%",
      growth: "+8%",
    },
    {
      country: "Germany",
      users: 178,
      percentage: 14,
      sessions: 334,
      avgSession: "5m 12s",
      bounceRate: "25%",
      growth: "+15%",
    },
    {
      country: "France",
      users: 145,
      percentage: 12,
      sessions: 278,
      avgSession: "3m 56s",
      bounceRate: "35%",
      growth: "+6%",
    },
    {
      country: "Canada",
      users: 98,
      percentage: 8,
      sessions: 187,
      avgSession: "4m 34s",
      bounceRate: "30%",
      growth: "+18%",
    },
    {
      country: "Australia",
      users: 67,
      percentage: 5,
      sessions: 123,
      avgSession: "4m 12s",
      bounceRate: "27%",
      growth: "+22%",
    },
  ];

  const topPages = [
    {
      page: "/dashboard",
      views: 2456,
      avgTime: "3m 45s",
      bounce: "32%",
      icon: LayoutDashboard,
    },
    {
      page: "/products/analytics",
      views: 1876,
      avgTime: "5m 12s",
      bounce: "28%",
      icon: LineChart,
    },
    {
      page: "/pricing",
      views: 1543,
      avgTime: "2m 34s",
      bounce: "45%",
      icon: DollarSign,
    },
    {
      page: "/auth/sign-up",
      views: 987,
      avgTime: "1m 56s",
      bounce: "52%",
      icon: Sparkles,
    },
    {
      page: "/docs",
      views: 765,
      avgTime: "6m 23s",
      bounce: "21%",
      icon: BookOpen,
    },
  ];

  const trafficSources = [
    {
      source: "Direct",
      users: 487,
      percentage: 39,
      color: "bg-[var(--color-indeks-green)]",
    },
    {
      source: "Organic Search",
      users: 356,
      percentage: 29,
      color: "bg-[var(--color-indeks-blue)]",
    },
    {
      source: "Social Media",
      users: 245,
      percentage: 20,
      color: "bg-[var(--color-indeks-yellow)]",
    },
    {
      source: "Referral",
      users: 146,
      percentage: 12,
      color: "bg-[var(--color-indeks-orange)]",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Realtime Traffic
          </h1>
          <p className="text-muted-foreground">
            Monitor your website&apos;s traffic and user activity in real-time
          </p>
        </div>

        {/* Real-time Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {realtimeStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge
                        variant={stat.trend === "up" ? "success" : "error"}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        vs last hour
                      </span>
                    </div>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Globe and Top Locations - 50/50 Split */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Globe Visualization */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Global Traffic Map</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time visualization of visitor locations worldwide
                </p>
              </div>
              <div className="flex items-center justify-center py-4">
                <Cobe
                  variant="auto-draggable"
                  className="w-full"
                  markerColor="#ffffff"
                  baseColor="#fff5e1"
                  opacity={1.0}
                  phi={0.003}
                  mapBrightness={5}
                />
              </div>
            </div>
          </Card>

          {/* Top Locations */}
          <Card className="p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-[var(--color-indeks-green)]" />
              <h3 className="text-lg font-semibold">Top Countries</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {topLocations.map((location) => {
                return (
                  <div
                    key={location.country}
                    className="bg-accent/30 hover:bg-accent/50 rounded-lg p-3 transition-colors border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">
                        {getCountryFlag(location.country)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {location.country}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Users & Growth */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Users
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold">
                            {location.users}
                          </span>
                          <Badge
                            variant="success"
                            className="text-[10px] px-1 py-0 h-4"
                          >
                            {location.growth}
                          </Badge>
                        </div>
                      </div>

                      {/* Sessions */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Sessions
                        </span>
                        <span className="text-xs font-medium">
                          {location.sessions}
                        </span>
                      </div>

                      {/* Avg Session & Bounce Rate */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Avg
                          </span>
                        </div>
                        <span className="text-xs font-medium">
                          {location.avgSession}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Bounce
                        </span>
                        <span className="text-xs font-medium text-orange-600">
                          {location.bounceRate}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-1">
                        <div className="w-full bg-secondary rounded-full h-1.5 mb-1">
                          <div
                            className="bg-[var(--color-indeks-green)] h-1.5 rounded-full"
                            style={{ width: `${location.percentage}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-[var(--color-indeks-green)]">
                            {location.percentage}% of traffic
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Traffic Details Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Pages */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--color-indeks-blue)]" />
                <h3 className="text-lg font-semibold">Top Pages</h3>
              </div>
              <div className="space-y-3">
                {topPages.map((page) => {
                  const IconComponent = page.icon;
                  return (
                    <div
                      key={page.page}
                      className="space-y-2 pb-3 border-b last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs bg-secondary px-2 py-1 rounded">
                            {page.page}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {page.views} views
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pl-8">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{page.avgTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{page.bounce} bounce</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Traffic Sources */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--color-indeks-orange)]" />
                <h3 className="text-lg font-semibold">Traffic Sources</h3>
              </div>
              <div className="space-y-3">
                {trafficSources.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {source.source}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {source.users} users
                      </span>
                    </div>
                    <div className="relative w-full bg-secondary rounded-full h-2">
                      <div
                        className={`${source.color}/80 h-2 rounded-full transition-all`}
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {source.percentage}% of total traffic
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--color-indeks-yellow)]" />
              <h3 className="text-lg font-semibold">Live Activity</h3>
              <Badge variant="success" className="ml-2">
                Live
              </Badge>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[
                {
                  user: "Anonymous User",
                  action: "Viewed",
                  page: "/products/analytics",
                  location: "New York, USA",
                  time: "Just now",
                },
                {
                  user: "Anonymous User",
                  action: "Signed up",
                  page: "/auth/sign-up",
                  location: "London, UK",
                  time: "2s ago",
                },
                {
                  user: "Anonymous User",
                  action: "Viewed",
                  page: "/dashboard",
                  location: "Berlin, Germany",
                  time: "5s ago",
                },
                {
                  user: "Anonymous User",
                  action: "Downloaded",
                  page: "/reports/monthly",
                  location: "Paris, France",
                  time: "12s ago",
                },
                {
                  user: "Anonymous User",
                  action: "Viewed",
                  page: "/pricing",
                  location: "Toronto, Canada",
                  time: "18s ago",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[var(--color-indeks-green)] animate-pulse" />
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        {activity.action.toLowerCase()}{" "}
                        <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">
                          {activity.page}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.location}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
