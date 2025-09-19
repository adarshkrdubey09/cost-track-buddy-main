import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Expense } from "@/types/expense";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.price, 0);
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  const thisMonthExpenses = expenses.filter(exp => 
    exp.month === currentMonth && exp.year === currentYear
  );
  const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.price, 0);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track your expenses</p>
          </div>
          <Button 
            onClick={() => navigate("/add-expense")} 
            size="lg"
            className="self-start sm:self-auto"
          >
            Add New Expense
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">₹</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📅</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{thisMonthTotal.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{currentMonth} {currentYear}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenses.length}</div>
              <p className="text-xs text-muted-foreground">Expense entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              Your latest expense entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">No expenses recorded yet</div>
                <Button onClick={() => {navigate("/add-expense",{ relative: 'route' })}}>
                  Add Your First Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.slice(0, 10).map((expense) => (
                  <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-border rounded-lg bg-card gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{expense.embossingCenterName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {expense.state} • {expense.month} {expense.year}
                          </p>
                        </div>
                        <Badge variant="secondary" className="self-start sm:self-auto">{expense.category}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-lg">₹{expense.price.toLocaleString()}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          className="flex-1 sm:flex-none"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="flex-1 sm:flex-none"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {expenses.length > 10 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" className="w-full sm:w-auto">
                      View All Expenses ({expenses.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}