import { ChartOverview } from "@/components/chart";
import { Sales } from "@/components/sales";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, DollarSign, Euro, Eye, Percent, UserCheck, UserCog, UserRoundPlus, UserRoundX, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <main className="sm:ml-14 p-4">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 ">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                Total vendas
              </CardTitle>
              <DollarSign className="ml-auto w-4 h-4"/>
            </div> 
            <CardDescription>
              Total vendas em 90 dias  
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              R$ 40.000
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                Novos clientes
              </CardTitle>
              <Users className="ml-auto w-4 h-4"/>
            </div> 
            <CardDescription>
              Novos clientes em 30 dias  
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              234
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                Pedidos hoje
              </CardTitle>
              <Percent className="ml-auto w-4 h-4"/>
            </div> 
            <CardDescription>
              Total de pedidos hoje 
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              65
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                Total pedidos
              </CardTitle>
              <BadgeDollarSign className="ml-auto w-4 h-4"/>
            </div> 
            <CardDescription>
              Total de pedidos em 30 dias
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              2200
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 flex flex-col md:flex-row gap-4">

               
          <Card className="cursor-pointer hover:bg-green-100 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-center">
                <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                  Clientes Ativos
                </CardTitle>
                <UserCheck className="ml-auto w-4 h-4" color="green"/>
              </div> 
              <CardDescription>
                Numero de clientes ativos
              </CardDescription>           
            </CardHeader>
            <CardContent>
              <p
              className="text-bas sm:text-lg font-bold"
              >
                2200
              </p>
            </CardContent>
          </Card>

        <Card className="cursor-pointer hover:bg-red-100 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                Clientes inativos
              </CardTitle>
              <UserRoundX className="ml-auto w-4 h-4" color="red"/>
            </div> 
            <CardDescription>
              Numero de clientes inativos
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              2200
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-blue-100 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                Leads
              </CardTitle>
              <UserRoundPlus className="ml-auto w-4 h-4" color="blue"/>
            </div> 
            <CardDescription>
              Numero de leads
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              2200
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-purple-100 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                Follow-ups
              </CardTitle>
              <UserCog className="ml-auto w-4 h-4" color="purple"/>
            </div> 
            <CardDescription>
              Numero de follow-ups
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              2200
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-orange-100 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg sm:text-xl text-gray-800 select-none">
                FINANCEIRO
              </CardTitle>
              <Euro className="ml-auto w-4 h-4" color="orange"/>
            </div> 
            <CardDescription>
              Movimentações dos últimos 30 dias
            </CardDescription>           
          </CardHeader>
          <CardContent>
            <p
            className="text-bas sm:text-lg font-bold"
            >
              2200
            </p>
          </CardContent>
        </Card>



      </section>
      {/*
      
      <section className="mt-4 flex flex-col md:flex-row gap-4">
        <ChartOverview/>
        <Sales/>
      </section>
      */}
    </main>
  );
}
