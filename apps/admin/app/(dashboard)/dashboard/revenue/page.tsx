import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import { DollarSign, TrendingUp, Building2, Info } from "lucide-react";

const MOCK_CHAPTER_REVENUE = [
  { chapter: "WIAL Nigeria", total: 125000, thisMonth: 32000, coaches: 18, status: "active" },
  { chapter: "WIAL Brazil", total: 98000, thisMonth: 24500, coaches: 14, status: "active" },
  { chapter: "WIAL USA", total: 215000, thisMonth: 41000, coaches: 32, status: "active" },
  { chapter: "WIAL Philippines", total: 67000, thisMonth: 15000, coaches: 9, status: "active" },
  { chapter: "WIAL Germany", total: 142000, thisMonth: 28000, coaches: 21, status: "active" },
  { chapter: "WIAL Kenya", total: 45000, thisMonth: 11000, coaches: 7, status: "active" },
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function RevenuePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  if (!isSuperAdmin(user.roles)) redirect("/dashboard");

  const totalRevenue = MOCK_CHAPTER_REVENUE.reduce((s, c) => s + c.total, 0);
  const monthlyRevenue = MOCK_CHAPTER_REVENUE.reduce((s, c) => s + c.thisMonth, 0);
  const totalCoaches = MOCK_CHAPTER_REVENUE.reduce((s, c) => s + c.coaches, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">
          Global payment overview across all chapters.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3">
        <Info className="h-5 w-5 text-info shrink-0" />
        <div>
          <p className="text-sm font-medium">Coming Soon</p>
          <p className="text-sm text-muted-foreground">
            Global revenue tracking and reporting is under development. The data below is sample data for preview purposes.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Across {MOCK_CHAPTER_REVENUE.length} chapters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">March 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Coaches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCoaches}</p>
            <p className="text-xs text-muted-foreground mt-1">Generating revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Chapter Breakdown */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Coaches</TableHead>
              <TableHead className="text-right">This Month</TableHead>
              <TableHead className="text-right">Total Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CHAPTER_REVENUE.map((c) => (
              <TableRow key={c.chapter}>
                <TableCell className="font-medium">{c.chapter}</TableCell>
                <TableCell>
                  <Badge variant="default" className="capitalize">{c.status}</Badge>
                </TableCell>
                <TableCell>{c.coaches}</TableCell>
                <TableCell className="text-right">{formatCurrency(c.thisMonth)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(c.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
