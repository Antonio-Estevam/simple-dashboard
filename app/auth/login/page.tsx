'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? "Erro ao fazer login");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <main className="w-full flex flex-rowalign-top h-screen col-12">
        <aside className="w-8/12 h-full bg-[url(/gym.jpg)] bg-contain bg-no-repeat bg-cover hidden md:flex">
        </aside>
        <section className="  lg:w-1/3 md:w-6/12 w-full h-full flex flex-col justify-between ms:flex ms:w-full"> 
          <header className="flex justify-center mt-4 mb-4">
            <h1 className="text-5xl font-bold text-gray-800">Coaching SO</h1>
          </header>  

          <article className="w-full h-1/4 flex flex-col items-center justify-center px-6">
            <p className="mb-2">aqui vai ficar o formulário de login, mas como ainda não tem o formulário de login, eu vou deixar esse espaço em branco por enquanto </p>    
            <Input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Username" className="mb-4" />
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="mb-4" />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <Button variant="default" type="submit" onClick={handleSubmit} className="w-full">
              {isLoading ? (
                <>
                  <Spinner />
                  <p>Conectando...</p>
                </>
              ) : (
                "Login"
              )}
            </Button>

            <p>Para solicitar acesso clique <Link href="/request-access" className="text-blue-700 underline">
              aqui
            </Link>
            </p>
          </article>

          <footer className="flex justify-center mt-4 mb-4">
            <p className="text-gray-600">© 2023 Coaching SO. Todos os direitos reservados.</p>
          </footer>
        </section>
    </main>
  );
}
