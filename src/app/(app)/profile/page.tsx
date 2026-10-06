import { BackLink } from "@/components/back-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { fmtDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/roles";
import { DeleteProfileForm } from "./delete-profile-form";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const me = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: me.id } });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <BackLink />
        <h1 className="mt-3 text-2xl font-semibold">Профиль</h1>
        <p className="text-sm text-muted-foreground">
          {ROLE_LABELS[user.role]} · в системе с {fmtDateTime(user.createdAt)}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Личные данные</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm initial={{ name: user.name, email: user.email }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Удаление профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
