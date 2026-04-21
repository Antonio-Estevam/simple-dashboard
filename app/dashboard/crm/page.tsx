import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BadgeDollarSign, DollarSign, Euro, Percent,
  UserCheck, UserCog, UserRoundPlus, UserRoundX, Users,
} from "lucide-react";

export default function Dashboard() {
  return (
    <main className="sm:ml-14 p-4">
      {/* ── KPI row ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Total vendas</CardTitle>
              <DollarSign className="ml-auto w-4 h-4 text-muted-foreground" />
            </div>
            <CardDescription>Total vendas em 90 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">R$ 40.000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Novos clientes</CardTitle>
              <Users className="ml-auto w-4 h-4 text-muted-foreground" />
            </div>
            <CardDescription>Novos clientes em 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">234</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Pedidos hoje</CardTitle>
              <Percent className="ml-auto w-4 h-4 text-muted-foreground" />
            </div>
            <CardDescription>Total de pedidos hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">65</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Total pedidos</CardTitle>
              <BadgeDollarSign className="ml-auto w-4 h-4 text-muted-foreground" />
            </div>
            <CardDescription>Total de pedidos em 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">2200</p>
          </CardContent>
        </Card>
      </section>

      {/* ── Quick-access cards ── */}
      <section className="mt-4 flex flex-col md:flex-row gap-4">
        <Card className="cursor-pointer transition-colors hover:bg-green-50 dark:hover:bg-green-950/30">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Clientes Ativos</CardTitle>
              <UserCheck className="ml-auto w-4 h-4 text-green-500" />
            </div>
            <CardDescription>Numero de clientes ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">2200</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/30">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Clientes inativos</CardTitle>
              <UserRoundX className="ml-auto w-4 h-4 text-red-500" />
            </div>
            <CardDescription>Numero de clientes inativos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">2200</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Leads</CardTitle>
              <UserRoundPlus className="ml-auto w-4 h-4 text-blue-500" />
            </div>
            <CardDescription>Numero de leads</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">2200</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-purple-50 dark:hover:bg-purple-950/30">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Follow-ups</CardTitle>
              <UserCog className="ml-auto w-4 h-4 text-purple-500" />
            </div>
            <CardDescription>Numero de follow-ups</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">2200</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/30">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl select-none">Financeiro</CardTitle>
              <Euro className="ml-auto w-4 h-4 text-orange-500" />
            </div>
            <CardDescription>Movimentações dos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-base sm:text-lg font-bold">2200</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
