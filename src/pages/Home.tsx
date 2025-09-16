import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutDashboard } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types/expense";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login",{ relative: 'route' });
      return;
    }

    // Load expenses from localStorage
    const savedExpenses = localStorage.getItem("expenses");
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, [navigate]);

  const handleEdit = (expense: Expense) => {
    navigate(`/edit-expense/${expense.id}`);
  };

  const handleDelete = (expenseId: string) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    setExpenses(updatedExpenses);
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
    
    toast({
      title: "Expense deleted",
      description: "Expense has been successfully deleted.",
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-medium text-foreground">Home</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and track your expenses</p>
        </div>

        {/* Main Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto px-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {navigate("/add-expense",{ relative: 'route' })}}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Add New Expense</CardTitle>
              <CardDescription>
                Create a new expense entry with category and pricing details
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => {
            // For now, we'll show a simple list. Later we can create a dedicated view page
            
            // Navigate to view expenses page
            navigate("/view-expenses",{ relative: 'route' });
          }}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <LayoutDashboard className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">View Expenses</CardTitle>
              <CardDescription>
                View and edit your existing expense entries
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
}