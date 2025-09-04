import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ExpenseTable } from "@/components/ExpenseTable";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  state: string;
  state_id: string;
  month: string;
  year: number;
}

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login");
      return;
    }

    // Load expense data
    if (id) {
      const expenses: Expense[] = JSON.parse(localStorage.getItem("expenses") || "[]");
      const foundExpense = expenses.find((exp) => exp.id === id);

      if (foundExpense) {
        setExpense(foundExpense);
      } else {
        toast({
          title: "Expense not found",
          description: "The requested expense could not be found",
          variant: "destructive",
        });
        navigate("/home");
      }
    }
  }, [id, navigate, toast]);

  if (!expense) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading expense data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Expense</h1>
            <p className="text-muted-foreground">Update expense data in the table below</p>
          </div>
        </div>

        <ExpenseTable
          selectedState={expense.state}
          selectedMonth={expense.month}
          selectedYear={expense.year}
          selectedStateId={expense.state_id}
          isEditMode={true}
          isEditingEnabled={true}
        />
      </div>
    </Layout>
  );
}
