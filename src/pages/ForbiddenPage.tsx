export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">403 — Forbidden</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    </div>
  );
}
