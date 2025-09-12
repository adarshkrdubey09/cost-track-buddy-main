import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    if (localStorage.getItem("isAuthenticated")) {
      navigate("/chat");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto text-center">
        {/* Title + Subtitle */}
        <div className="mb-12 px-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 leading-tight">
            ExpenseTracker
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Manage your expenses efficiently with our professional tracking system
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 px-2">
          <Card className="bg-card/80 backdrop-blur border-0 shadow-lg hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-primary text-lg sm:text-xl">📊 Track Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm sm:text-base">
                Monitor your spending across different categories, states, and embossing centers
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-0 shadow-lg hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-accent text-lg sm:text-xl">📈 Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm sm:text-base">
                Get insights into your spending patterns with detailed analytics and reports
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-0 shadow-lg hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <CardTitle className="text-primary text-lg sm:text-xl">🎯 Organized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm sm:text-base">
                Keep your financial data organized by month, year, state, and category
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-6 sm:px-8 py-3 text-base sm:text-lg rounded-xl shadow-md"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
