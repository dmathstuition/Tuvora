import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { listTeam, uploadMemberAvatarAction } from '@/services/organizations/members';
import { can } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { InviteMember } from './invite-member';
import { MemberActions } from './member-actions';

export const metadata: Metadata = { title: 'Team' };

export default async function TeamPage() {
  const ctx = await getAuthContext();
  const canManage = !!ctx && can(ctx, 'members.manage');
  const canRemove = !!ctx && can(ctx, 'members.remove');
  const canInvite = !!ctx && can(ctx, 'members.invite');

  const { members, invites } = await listTeam();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage tutors, staff and their roles. Roles control what each member can do.
        </p>
      </div>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite a team member</CardTitle>
            <CardDescription>They&apos;ll join with the role you choose.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteMember />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarUpload
                        action={uploadMemberAvatarAction}
                        id={m.id}
                        currentUrl={m.avatarUrl}
                        name={m.name ?? m.email}
                        size={40}
                        canEdit={canManage}
                      />
                      <div>
                        <p className="font-medium">
                          {m.name ?? m.email}
                          {m.isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MemberActions
                      memberId={m.id}
                      role={m.role}
                      isOwner={m.role === 'owner'}
                      isSelf={m.isSelf}
                      canManage={canManage}
                      canRemove={canRemove}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invites ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invites.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState title="No pending invites" description="Invite tutors and staff above." />
              </div>
            ) : (
              <ul className="divide-y">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{i.email}</p>
                      <p className="text-xs text-muted-foreground">Invited as {i.role}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
