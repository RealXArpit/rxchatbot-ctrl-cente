import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/platform/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  UserPlus, MoreHorizontal, Lock, Circle, Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PERMISSIONS = [
  { key: 'view_overview', label: 'View Overview', group: 'General' },
  { key: 'view_chat_logs', label: 'Chat Logs', group: 'General' },
  { key: 'view_monitoring', label: 'Monitoring', group: 'General' },
  { key: 'view_feedback', label: 'Feedback', group: 'General' },
  { key: 'view_audit', label: 'Audit Trail', group: 'General' },
  { key: 'export_data', label: 'Export Data', group: 'General' },
  { key: 'kb_submit', label: 'Submit KB Entries', group: 'Knowledge Base' },
  { key: 'kb_publish', label: 'Publish KB Entries', group: 'Knowledge Base' },
  { key: 'manage_escalations', label: 'Manage Escalations', group: 'Operations' },
  { key: 'agent_takeover', label: 'Agent Takeover', group: 'Operations' },
  { key: 'manage_config', label: 'Configuration', group: 'Administration' },
  { key: 'manage_integrations', label: 'Integrations', group: 'Administration' },
  { key: 'invite_users', label: 'Invite Users', group: 'Administration' },
  { key: 'manage_users', label: 'Manage Users', group: 'Administration' },
];

const ROLE_DEFAULTS: Record<string, string[]> = {
  OpsManager: ['view_overview','view_chat_logs','view_monitoring','view_feedback','view_audit','export_data','kb_submit','kb_publish','manage_escalations','agent_takeover','manage_config'],
  KnowledgeManager: ['view_overview','view_chat_logs','view_feedback','kb_submit'],
  SupportAgent: ['view_overview','view_chat_logs','manage_escalations','agent_takeover'],
  Auditor: ['view_overview','view_chat_logs','view_monitoring','view_audit','export_data'],
};

const ASSIGNABLE_ROLES = ['OpsManager', 'KnowledgeManager', 'SupportAgent', 'Auditor'] as const;

const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  OpsManager: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  KnowledgeManager: 'bg-green-500/15 text-green-700 dark:text-green-400',
  SupportAgent: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  Auditor: 'bg-muted text-muted-foreground',
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status?: string;
  created_at?: string;
}

interface PendingInvite {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  invited_by: string;
  invited_at: string;
  status: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupedPermissions() {
  const groups: Record<string, typeof PERMISSIONS> = {};
  for (const p of PERMISSIONS) {
    (groups[p.group] ??= []).push(p);
  }
  return groups;
}

function StatusDot({ status }: { status?: string }) {
  const s = status ?? 'active';
  const color = s === 'active' ? 'text-green-500' : s === 'pending' ? 'text-amber-500' : 'text-muted-foreground';
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Circle className={`h-2.5 w-2.5 fill-current ${color}`} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Permissions Grid                                                   */
/* ------------------------------------------------------------------ */

function PermissionsGrid({
  checked, onChange, disabledKeys,
}: {
  checked: string[];
  onChange: (next: string[]) => void;
  disabledKeys?: Set<string>;
}) {
  const groups = groupedPermissions();
  const toggle = (key: string) => {
    onChange(
      checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key],
    );
  };
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, perms]) => (
        <div key={group}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
          <div className="grid grid-cols-2 gap-2">
            {perms.map((p) => {
              const disabled = disabledKeys?.has(p.key) ?? false;
              return (
                <label
                  key={p.key}
                  className={`flex items-center gap-2 text-sm rounded-md px-2 py-1.5 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 cursor-pointer'}`}
                >
                  <Checkbox
                    checked={checked.includes(p.key)}
                    onCheckedChange={() => !disabled && toggle(p.key)}
                    disabled={disabled}
                  />
                  {p.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function UsersPage() {
  const { session } = useAuth();
  const currentUser = session?.user;
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  /* ---- invite sheet state ---- */
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState<string>('SupportAgent');
  const [invPerms, setInvPerms] = useState<string[]>(ROLE_DEFAULTS['SupportAgent']);
  const [invError, setInvError] = useState('');
  const [invConfirmOpen, setInvConfirmOpen] = useState(false);
  const [invSubmitting, setInvSubmitting] = useState(false);

  /* ---- edit sheet state ---- */
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  /* ---- deactivate / reactivate dialog ---- */
  const [deactivateUser, setDeactivateUser] = useState<UserProfile | null>(null);

  /* ---- data fetching ---- */
  const fetchData = useCallback(async () => {
    setLoadingMembers(true);
    const [mRes, iRes] = await Promise.all([
      supabase.from('user_profiles').select('*').order('created_at'),
      supabase.from('invite_pending').select('*').eq('status', 'pending').order('invited_at', { ascending: false }),
    ]);
    setMembers(mRes.data ?? []);
    setPendingInvites(iRes.data ?? []);
    setLoadingMembers(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ---- derived ---- */
  const activeSuperAdminCount = members.filter((m) => m.role === 'SuperAdmin' && (m.status ?? 'active') === 'active').length;
  const currentUserPerms = new Set(isSuperAdmin ? PERMISSIONS.map((p) => p.key) : (currentUser?.permissions ?? []));
  const disabledPermsForInvite = isSuperAdmin ? undefined : new Set(PERMISSIONS.map((p) => p.key).filter((k) => !currentUserPerms.has(k)));

  /* ---- invite handlers ---- */
  const resetInviteForm = () => {
    setInvName(''); setInvEmail(''); setInvRole('SupportAgent');
    setInvPerms(ROLE_DEFAULTS['SupportAgent']); setInvError('');
  };

  const handleInviteRoleChange = (role: string) => {
    setInvRole(role);
    setInvPerms(ROLE_DEFAULTS[role] ?? []);
  };

  const handleInvitePreConfirm = async () => {
    setInvError('');
    if (!invName.trim() || !invEmail.trim()) { setInvError('Name and email are required.'); return; }
    // duplicate check
    const [{ data: existingProfile }, { data: existingInvite }] = await Promise.all([
      supabase.from('user_profiles').select('id').eq('email', invEmail.trim()).maybeSingle(),
      supabase.from('invite_pending').select('id').eq('email', invEmail.trim()).eq('status', 'pending').maybeSingle(),
    ]);
    if (existingProfile || existingInvite) {
      setInvError('This email already has an account or a pending invitation.');
      return;
    }
    setInvConfirmOpen(true);
  };

  const handleInviteConfirm = async () => {
    setInvSubmitting(true);
    const { error } = await supabase.from('invite_pending').insert({
      name: invName.trim(),
      email: invEmail.trim(),
      role: invRole,
      permissions: invPerms,
      invited_by: currentUser!.id,
      status: 'pending',
    });
    setInvSubmitting(false);
    setInvConfirmOpen(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Invitation saved for ${invName.trim()}. Send them the invite link manually or set up the Edge Function.`);
    setInviteOpen(false);
    resetInviteForm();
    fetchData();
  };

  /* ---- edit handlers ---- */
  const openEdit = (u: UserProfile) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditPerms(u.permissions ?? []);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setEditSubmitting(true);
    const { error } = await supabase.from('user_profiles').update({ role: editRole, permissions: editPerms }).eq('id', editUser.id);
    setEditSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Updated access for ${editUser.name}.`);
    setEditOpen(false);
    fetchData();
  };

  /* ---- deactivate / reactivate ---- */
  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    const { error } = await supabase.from('user_profiles').update({ status: 'inactive' }).eq('id', deactivateUser.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${deactivateUser.name} has been deactivated.`);
    setDeactivateUser(null);
    fetchData();
  };

  const handleReactivate = async (u: UserProfile) => {
    const { error } = await supabase.from('user_profiles').update({ status: 'active' }).eq('id', u.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${u.name} has been reactivated.`);
    fetchData();
  };

  const handleCancelInvite = async (inv: PendingInvite) => {
    const { error } = await supabase.from('invite_pending').update({ status: 'cancelled' }).eq('id', inv.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Invitation cancelled.');
    fetchData();
  };

  /* ---- checked permission labels ---- */
  const checkedLabels = (perms: string[]) =>
    PERMISSIONS.filter((p) => perms.includes(p.key)).map((p) => p.label).join(', ');

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          title="Users & Roles"
          subtitle="Manage your team, roles, and feature access."
          actions={
            <Button onClick={() => { resetInviteForm(); setInviteOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Crew Member
            </Button>
          }
        />

        {/* ---- Active Members ---- */}
        {loadingMembers ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">Invite your first crew member to get started.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const isOwn = m.id === currentUser?.id;
                  const isSA = m.role === 'SuperAdmin';
                  const isInactive = (m.status ?? 'active') === 'inactive';
                  const isLastSA = isSA && activeSuperAdminCount <= 1;
                  const permCount = isSA ? PERMISSIONS.length : (m.permissions?.length ?? 0);

                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                            {m.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium text-foreground">{m.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <Badge variant="secondary" className={ROLE_COLORS[m.role] ?? ''}>
                            {m.role}
                          </Badge>
                          {isSA && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{permCount} / {PERMISSIONS.length}</TableCell>
                      <TableCell><StatusDot status={m.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isSA ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuItem disabled>Edit Access</DropdownMenuItem>
                                </TooltipTrigger>
                                <TooltipContent>SuperAdmin has all permissions</TooltipContent>
                              </Tooltip>
                            ) : (
                              <DropdownMenuItem onClick={() => openEdit(m)}>Edit Access</DropdownMenuItem>
                            )}
                            {!isOwn && !isInactive && (
                              isLastSA && isSA ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem disabled>Deactivate</DropdownMenuItem>
                                  </TooltipTrigger>
                                  <TooltipContent>Cannot remove the last admin</TooltipContent>
                                </Tooltip>
                              ) : (
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeactivateUser(m)}>
                                  Deactivate
                                </DropdownMenuItem>
                              )
                            )}
                            {isInactive && (
                              <DropdownMenuItem onClick={() => handleReactivate(m)}>Reactivate</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* ---- Pending Invitations ---- */}
        {pendingInvites.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-foreground">Pending Invitations</h2>
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                {pendingInvites.length}
              </Badge>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-foreground">{inv.name}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ROLE_COLORS[inv.role] ?? ''}>{inv.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {inv.invited_at ? new Date(inv.invited_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancelInvite(inv)}>
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/*  INVITE SHEET                                                     */}
        {/* ================================================================ */}
        <Sheet open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) resetInviteForm(); }}>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Invite Crew Member</SheetTitle>
              <SheetDescription>Add a new team member and assign their role & permissions.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="inv-name">Name</Label>
                <Input id="inv-name" value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-email">Email</Label>
                <Input id="inv-email" type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} placeholder="team@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={invRole} onValueChange={handleInviteRoleChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Permissions</Label>
                <PermissionsGrid checked={invPerms} onChange={setInvPerms} disabledKeys={disabledPermsForInvite} />
              </div>

              <div className="rounded-md bg-muted/50 border border-border p-3 flex gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>This person will have access to: {checkedLabels(invPerms) || 'none'}</span>
              </div>

              {invError && (
                <p className="text-sm text-destructive font-medium">{invError}</p>
              )}
            </div>

            <SheetFooter className="mt-6">
              <Button onClick={handleInvitePreConfirm} disabled={invSubmitting}>Send Invitation</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Invite confirmation dialog */}
        <AlertDialog open={invConfirmOpen} onOpenChange={setInvConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send invitation to {invEmail}?</AlertDialogTitle>
              <AlertDialogDescription>
                They will be invited as <strong>{invRole}</strong> with {invPerms.length} permission{invPerms.length !== 1 ? 's' : ''}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleInviteConfirm} disabled={invSubmitting}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ================================================================ */}
        {/*  EDIT SHEET                                                       */}
        {/* ================================================================ */}
        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Access — {editUser?.name}</SheetTitle>
              <SheetDescription>Update role and permissions for this team member.</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={(r) => { setEditRole(r); setEditPerms(ROLE_DEFAULTS[r] ?? []); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Permissions</Label>
                <PermissionsGrid checked={editPerms} onChange={setEditPerms} disabledKeys={disabledPermsForInvite} />
              </div>

              <div className="rounded-md bg-muted/50 border border-border p-3 flex gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>This person will have access to: {checkedLabels(editPerms) || 'none'}</span>
              </div>
            </div>

            <SheetFooter className="mt-6">
              <Button onClick={handleEditSave} disabled={editSubmitting}>Save Changes</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* ================================================================ */}
        {/*  DEACTIVATE DIALOG                                                */}
        {/* ================================================================ */}
        <AlertDialog open={!!deactivateUser} onOpenChange={(o) => { if (!o) setDeactivateUser(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {deactivateUser?.name}'s access?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate their account. They will no longer be able to log in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
