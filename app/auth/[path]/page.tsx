import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import Sidebar from "@/components/Sidebar";
import AuthPageGuard from "@/components/auth/AuthPageGuard";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <AuthPageGuard allowSignedIn={path === authViewPaths.RESET_PASSWORD}>
      <Sidebar />
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-5 py-12">
        <section className="w-full max-w-md rounded-[32px] bg-white px-6 py-8 shadow-sm">
          <div className="mb-7 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
              WALAWALA
            </p>
            <h1 className="mt-2 text-xl font-semibold text-gray-900">Tarot</h1>
          </div>

          <AuthView path={path} />
        </section>
      </main>
    </AuthPageGuard>
  );
}
