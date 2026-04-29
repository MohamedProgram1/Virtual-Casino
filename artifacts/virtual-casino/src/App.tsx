import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { CasinoProvider } from "@/lib/store";
import Layout from "@/components/layout/Layout";
import Lobby from "@/pages/Lobby";
import Slots from "@/pages/Slots";
import Blackjack from "@/pages/Blackjack";
import Roulette from "@/pages/Roulette";
import Dice from "@/pages/Dice";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Lobby} />
        <Route path="/slots" component={Slots} />
        <Route path="/blackjack" component={Blackjack} />
        <Route path="/roulette" component={Roulette} />
        <Route path="/dice" component={Dice} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CasinoProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              style: {
                background: "hsl(0 0% 10%)",
                border: "1px solid hsl(43 74% 49% / 0.3)",
                color: "hsl(45 29% 97%)",
              },
            }}
          />
        </CasinoProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
