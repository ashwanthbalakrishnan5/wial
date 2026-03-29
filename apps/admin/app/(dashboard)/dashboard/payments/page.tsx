import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  CreditCard,
  DollarSign,
  Clock,
  TrendingUp,
  Info,
} from "lucide-react";

const MOCK_PAYMENTS = [
  { id: "1", payer: "Maria Santos", email: "maria@example.com", type: "enrollment", amount: 5000, currency: "usd", status: "completed", date: "2026-03-15" },
  { id: "2", payer: "James Okafor", email: "james@example.com", type: "certification", amount: 3000, currency: "usd", status: "completed", date: "2026-03-12" },
  { id: "3", payer: "Anh Nguyen", email: "anh@example.com", type: "dues", amount: 15000, currency: "usd", status: "pending", date: "2026-03-10" },
  { id: "4", payer: "Carlos Rivera", email: "carlos@example.com", type: "event", amount: 7500, currency: "usd", status: "completed", date: "2026-03-08" },
  { id: "5", payer: "Elena Fischer", email: "elena@example.com", type: "enrollment", amount: 5000, currency: "usd", status: "failed", date: "2026-03-05" },
  { id: "6", payer: "Priya Sharma", email: "priya@example.com", type: "certification", amount: 3000, currency: "usd", status: "completed", date: "2026-03-01" },
];

const typeBadge: Record<string, string> = {
  enrollment: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  certification: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  dues: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  event: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
};

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function PaymentsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const chapterId = isAdmin
    ? cookieStore.get("selected-chapter")?.value || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  if (!chapterId && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Select a chapter to view payments.</p>
      </div>
    );
  }

  const totalCollected = 23500;
  const outstanding = 15000;
  const thisMonth = 15500;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track payments and manage dues collection.
          </p>
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3">
        <Info className="h-5 w-5 text-info shrink-0" />
        <div>
          <p className="text-sm font-medium">Coming Soon</p>
          <p className="text-sm text-muted-foreground">
            Payment processing via Stripe Connect and PayPal is under development. The data below is sample data for preview purposes.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCollected, "usd")}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(outstanding, "usd")}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(thisMonth, "usd")}</p>
            <p className="text-xs text-muted-foreground mt-1">March 2026</p>
          </CardContent>
        </Card>
      </div>

      {/* Connect Buttons */}
      <div className="flex gap-3">
        <Button disabled variant="outline" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Connect Stripe (Coming Soon)
        </Button>
        <Button disabled variant="outline" className="gap-2">
          <CreditCard className="h-4 w-4" />
          Connect PayPal (Coming Soon)
        </Button>
      </div>

      {/* Payments Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PAYMENTS.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{p.payer}</p>
                    <p className="text-sm text-muted-foreground">{p.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeBadge[p.type] ?? "bg-muted text-muted-foreground"}`}>
                    {p.type}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(p.amount, p.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadge[p.status] ?? "outline"} className="capitalize">
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
