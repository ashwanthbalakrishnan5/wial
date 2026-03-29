"use client";

import Link from "next/link";
import { Users, FileText, Rocket, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { useTranslations } from "next-intl";

export function BentoGrid() {
  const t = useTranslations("dashboard");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Manage Coaches */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{t("manageCoaches")}</CardTitle>
          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t("manageCoachesDesc")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/coaches">{t("goToDirectory")}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Edit Content */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{t("editContent")}</CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t("editContentDesc")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/content">{t("manageContent")}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Deploy Website */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{t("deployWebsite")}</CardTitle>
          <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <Rocket className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t("deployWebsiteDesc")}</p>
          <Button asChild variant="outline" className="w-full border-destructive/20 hover:bg-destructive/5 text-destructive">
            <Link href="/dashboard/deployments">{t("viewDeployments")}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Invite Team */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{t("inviteTeam")}</CardTitle>
          <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
            <UserPlus className="h-4 w-4 text-secondary-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t("inviteTeamDesc")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/users">{t("manageUsers")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
