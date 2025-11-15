'use client';

export function LoginFormSimple() {
  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Email
        </label>
        <input
          type="email"
          placeholder="admin@example.com"
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Contraseña
        </label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        Iniciar Sesión
      </button>
    </form>
  );
}
