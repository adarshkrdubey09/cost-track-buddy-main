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
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            ExpenseTracker
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Manage your expenses efficiently with our professional tracking system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">📊 Track Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your spending across different categories, states, and embossing centers
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-accent">📈 Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get insights into your spending patterns with detailed analytics and reports
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">🎯 Organized</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Keep your financial data organized by month, year, state, and category
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="px-8 py-3 text-lg"
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
