import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import ChatPage from "./pages/ChatPage";
import PostsPage from "./pages/PostsPage";
import StatsPage from "./pages/StatsPage";
import SyncPage from "./pages/SyncPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
