import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, INDIAN_STATES, MONTHS } from "@/types/expense";
import { useToast } from "@/hooks/use-toast";

interface ExpenseTableProps {
  selectedState: string;
  selectedMonth: string;
  selectedYear: number;
  isEditMode?: boolean;
  expenseId?: string;
  isViewMode?: boolean;
  isEditingEnabled?: boolean;
  onEditToggle?: () => void;
}

// Sample embossing centers for demonstration
const EMBOSSING_CENTERS = [
  "Center A", "Center B", "Center C", "Center D", "Center E"
];

export function ExpenseTable({ selectedState, selectedMonth, selectedYear, isEditMode, expenseId, isViewMode, isEditingEnabled, onEditToggle }: ExpenseTableProps) {
  const [tableData, setTableData] = useState<Record<string, Record<string, number>>>({});
  const { toast } = useToast();

  // Initialize table data
  useEffect(() => {
    if (isEditMode && expenseId) {
      // Load existing expense data for editing
      const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
      const expense = expenses.find((exp: any) => exp.id === expenseId);
      
      if (expense) {
        // Convert single expense to table format
        setTableData({
          [expense.category]: {
            [expense.embossingCenterName]: expense.price
          }
        });
      }
    } else if (isViewMode) {
      // Load existing expenses for viewing
      const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
      const filteredExpenses = expenses.filter((exp: any) => 
        exp.state === selectedState && 
        exp.month === selectedMonth && 
        exp.year === selectedYear
      );
      
      // Initialize table with loaded data
      const initialData: Record<string, Record<string, number>> = {};
      EXPENSE_CATEGORIES.forEach(category => {
        initialData[category] = {};
        EMBOSSING_CENTERS.forEach(center => {
          const expense = filteredExpenses.find((exp: any) => 
            exp.category === category && exp.embossingCenterName === center
          );
          initialData[category][center] = expense ? expense.price : 0;
        });
      });
      setTableData(initialData);
    } else {
      // Initialize empty table for new expenses
      const initialData: Record<string, Record<string, number>> = {};
      EXPENSE_CATEGORIES.forEach(category => {
        initialData[category] = {};
        EMBOSSING_CENTERS.forEach(center => {
          initialData[category][center] = 0;
        });
      });
      setTableData(initialData);
    }
  }, [isEditMode, expenseId, isViewMode, selectedState, selectedMonth, selectedYear]);

  const updateCellValue = (category: string, center: string, value: number) => {
    setTableData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [center]: value
      }
    }));
  };

  const handleSave = () => {
    if (isViewMode) {
      // In view mode, update existing expenses
      const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
      const timestamp = new Date().toISOString();
      
      // Remove existing expenses for this period
      const filteredExpenses = expenses.filter((exp: any) => 
        !(exp.state === selectedState && 
          exp.month === selectedMonth && 
          exp.year === selectedYear)
      );
      
      // Convert table data to individual expense records
      const newExpenses: any[] = [];
      
      Object.entries(tableData).forEach(([category, centers]) => {
        Object.entries(centers).forEach(([centerName, price]) => {
          if (price > 0) {
            newExpenses.push({
              id: `${Date.now()}-${Math.random()}`,
              state: selectedState,
              embossingCenterName: centerName,
              month: selectedMonth,
              year: selectedYear,
              category,
              price,
              createdAt: timestamp,
              updatedAt: timestamp,
            });
          }
        });
      });

      const updatedExpenses = [...newExpenses, ...filteredExpenses];
      localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
      
      toast({
        title: "Expenses Updated!",
        description: `Updated ${newExpenses.length} expense entries`,
      });
      
      if (onEditToggle) {
        onEditToggle();
      }
      
      return;
    }

    const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
    const timestamp = new Date().toISOString();
    
    // Convert table data to individual expense records
    const newExpenses: any[] = [];
    
    Object.entries(tableData).forEach(([category, centers]) => {
      Object.entries(centers).forEach(([centerName, price]) => {
        if (price > 0) {
          newExpenses.push({
            id: isEditMode ? expenseId : `${Date.now()}-${Math.random()}`,
            state: selectedState,
            embossingCenterName: centerName,
            month: selectedMonth,
            year: selectedYear,
            category,
            price,
            createdAt: isEditMode ? 
              expenses.find((exp: any) => exp.id === expenseId)?.createdAt || timestamp 
              : timestamp,
            updatedAt: timestamp,
          });
        }
      });
    });

    if (newExpenses.length === 0) {
      toast({
        title: "No data to save",
        description: "Please enter at least one expense amount",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode) {
      // Remove old expense and add new ones
      const filteredExpenses = expenses.filter((exp: any) => exp.id !== expenseId);
      const updatedExpenses = [...newExpenses, ...filteredExpenses];
      localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
      
      toast({
        title: "Expense Updated!",
        description: `Updated ${newExpenses.length} expense entries`,
      });
    } else {
      // Add new expenses
      const updatedExpenses = [...newExpenses, ...expenses];
      localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
      
      toast({
        title: "Expenses Added!",
        description: `Added ${newExpenses.length} expense entries`,
      });
    }
  };

  const getTotalForCategory = (category: string) => {
    return Object.values(tableData[category] || {}).reduce((sum, value) => sum + value, 0);
  };

  const getTotalForCenter = (center: string) => {
    return Object.values(tableData).reduce((sum, categoryData) => {
      return sum + (categoryData[center] || 0);
    }, 0);
  };

  const getGrandTotal = () => {
    return Object.values(tableData).reduce((total, categoryData) => {
      return total + Object.values(categoryData).reduce((sum, value) => sum + value, 0);
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Expense Data" : "Add Expense Data"} - {selectedState}, {selectedMonth} {selectedYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full border-collapse border border-border min-w-[640px]">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-1 sm:p-2 text-left font-medium text-xs sm:text-sm">Category</th>
                {EMBOSSING_CENTERS.map(center => (
                  <th key={center} className="border border-border p-1 sm:p-2 text-center font-medium min-w-20 sm:min-w-32 text-xs sm:text-sm">
                    <span className="block sm:hidden">{center.slice(0, 8)}...</span>
                    <span className="hidden sm:block">{center}</span>
                  </th>
                ))}
                <th className="border border-border p-1 sm:p-2 text-center font-medium bg-accent/20 text-xs sm:text-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_CATEGORIES.map(category => (
                <tr key={category} className="hover:bg-muted/50">
                  <td className="border border-border p-1 sm:p-2 font-medium bg-muted/30 text-xs sm:text-sm">
                    <span className="block sm:hidden">{category.slice(0, 10)}...</span>
                    <span className="hidden sm:block">{category}</span>
                  </td>
                  {EMBOSSING_CENTERS.map(center => (
                    <td key={center} className="border border-border p-0.5 sm:p-1">
                      {isViewMode ? (
                        <div className="text-center p-1 sm:p-2 min-h-8 sm:min-h-10 flex items-center justify-center text-xs sm:text-sm">
                          <span className="block sm:hidden">₹{Math.round((tableData[category]?.[center] || 0) / 1000)}k</span>
                          <span className="hidden sm:block">₹{(tableData[category]?.[center] || 0).toLocaleString()}</span>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tableData[category]?.[center] || 0}
                          onChange={(e) => updateCellValue(category, center, parseFloat(e.target.value) || 0)}
                          className="text-center border-0 bg-transparent focus:bg-background text-xs sm:text-sm h-8 sm:h-10"
                          placeholder="0"
                        />
                      )}
                    </td>
                  ))}
                  <td className="border border-border p-1 sm:p-2 text-center font-semibold bg-accent/10 text-xs sm:text-sm">
                    <span className="block sm:hidden">₹{Math.round(getTotalForCategory(category) / 1000)}k</span>
                    <span className="hidden sm:block">₹{getTotalForCategory(category).toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-accent/20 font-semibold">
                <td className="border border-border p-1 sm:p-2 text-xs sm:text-sm">Total</td>
                {EMBOSSING_CENTERS.map(center => (
                  <td key={center} className="border border-border p-1 sm:p-2 text-center text-xs sm:text-sm">
                    <span className="block sm:hidden">₹{Math.round(getTotalForCenter(center) / 1000)}k</span>
                    <span className="hidden sm:block">₹{getTotalForCenter(center).toLocaleString()}</span>
                  </td>
                ))}
                <td className="border border-border p-1 sm:p-2 text-center bg-accent/30 text-sm sm:text-lg font-bold">
                  <span className="block sm:hidden">₹{Math.round(getGrandTotal() / 1000)}k</span>
                  <span className="hidden sm:block">₹{getGrandTotal().toLocaleString()}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {(isEditingEnabled || (!isViewMode && !isEditingEnabled)) && (
          <div className="flex justify-center sm:justify-end mt-4 sm:mt-6 px-3 sm:px-0">
            <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
              {isEditingEnabled ? "Save Changes" : isEditMode ? "Update Expenses" : "Save Expenses"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}