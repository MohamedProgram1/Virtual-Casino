import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { CasinoProvider } from "@/lib/store";
import { PlayAgainProvider } from "@/lib/playAgain";
import Layout from "@/components/layout/Layout";
import Lobby from "@/pages/Lobby";
import Slots from "@/pages/Slots";
import Blackjack from "@/pages/Blackjack";
import Roulette from "@/pages/Roulette";
import Dice from "@/pages/Dice";
import Plinko from "@/pages/Plinko";
import Mines from "@/pages/Mines";
import Crash from "@/pages/Crash";
import Wheel from "@/pages/Wheel";
import HiLo from "@/pages/HiLo";
import Keno from "@/pages/Keno";
import CoinFlip from "@/pages/CoinFlip";
import Scratch from "@/pages/Scratch";
import Baccarat from "@/pages/Baccarat";
import Poker from "@/pages/Poker";
import Pachinko from "@/pages/Pachinko";
import OwnerVault from "@/pages/OwnerVault";
import OwnerSafe from "@/pages/OwnerSafe";
import LoanShark from "@/pages/LoanShark";
import Store from "@/pages/Store";
import Bar from "@/pages/Bar";
import Lounge from "@/pages/Lounge";
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
        <Route path="/plinko" component={Plinko} />
        <Route path="/mines" component={Mines} />
        <Route path="/crash" component={Crash} />
        <Route path="/wheel" component={Wheel} />
        <Route path="/hilo" component={HiLo} />
        <Route path="/keno" component={Keno} />
        <Route path="/coin-flip" component={CoinFlip} />
        <Route path="/scratch" component={Scratch} />
        <Route path="/baccarat" component={Baccarat} />
        <Route path="/poker" component={Poker} />
        <Route path="/pachinko" component={Pachinko} />
        <Route path="/owner-vault" component={OwnerVault} />
        <Route path="/owner-safe" component={OwnerSafe} />
        <Route path="/loan-shark" component={LoanShark} />
        <Route path="/store" component={Store} />
        <Route path="/bar" component={Bar} />
        <Route path="/lounge" component={Lounge} />
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
          <PlayAgainProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </PlayAgainProvider>
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
