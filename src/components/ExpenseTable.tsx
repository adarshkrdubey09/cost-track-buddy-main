import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ExpenseTableProps {
  selectedState: string;
  selectedMonth: string;
  selectedYear: number;
  selectedStateId: string | null;
  isEditMode?: boolean;
  isViewMode?: boolean;
  isEditingEnabled?: boolean;
  isAddMode?: boolean;
  onEditToggle?: () => void;
}

interface Center {
  id: number;
  name: string;
  location: string;
}

interface ExpenseHead {
  id: number;
  name: string;
  category: string;
}

interface EcAmount {
  ec_id: number;
  amount: number;
}

interface ExpenseSummaryItem {
  expense_head_id: number;
  ec_amounts: EcAmount[];
}

export function ExpenseTable({
  selectedState,
  selectedMonth,
  selectedYear,
  selectedStateId,
  isEditMode,
  isViewMode,
  isEditingEnabled,
  isAddMode,
}: ExpenseTableProps) {
  const [centers, setCenters] = useState<Center[]>([]);
  const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
  const [tableData, setTableData] = useState<Record<string, Record<string, number>>>({});
  const [newCategories, setNewCategories] = useState<Set<string>>(new Set());
  const [modifiedBy, setModifiedBy] = useState<string | null>(null);
  const [modifiedAt, setModifiedAt] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkTokenValidity = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch("https://ai.rosmerta.dev/expense/api/auth/check", {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.status === 200;
    } catch {
      return false;
    }
  };

  const validateAndProceed = async (): Promise<string | null> => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      logoutAndRedirect();
      return null;
    }

    const isValid = await checkTokenValidity(token);
    if (!isValid) {
      logoutAndRedirect();
      return null;
    }

    return token;
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userloginname");
    localStorage.removeItem("userfirstname");
    localStorage.removeItem("userlastname");
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        if (!selectedStateId) return;
        const token = await validateAndProceed();
        if (!token) return;

        const res = await fetch(
          `https://ai.rosmerta.dev/expense/api/embossing-centers/by-state/${selectedStateId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch centers");

        const data: Center[] = await res.json();
        setCenters(data);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    };

    const fetchExpenseHeads = async () => {
      try {
        const token = await validateAndProceed();
        if (!token) return;

        const res = await fetch("https://ai.rosmerta.dev/expense/api/expense/expense-heads", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch expense heads");

        const data: ExpenseHead[] = await res.json();
        setExpenseHeads(data);
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    };

    fetchCenters();
    fetchExpenseHeads();
  }, [selectedStateId]);

  useEffect(() => {
    if (isAddMode && centers.length && expenseHeads.length) {
      const initialTable: Record<string, Record<string, number>> = {};
      expenseHeads.forEach((head) => {
        const key = `${head.name} - ${head.category}`;
        const row: Record<string, number> = {};
        centers.forEach((center) => {
          row[center.name] = 0;
        });
        initialTable[key] = row;
      });
      setTableData(initialTable);
    }
  }, [isAddMode, centers, expenseHeads]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (!selectedStateId) return;
        const token = await validateAndProceed();
        if (!token) return;

        const { data } = await axios.get<{
          modified_by: string | null;
          modified_at: string | null;
          expense_heads: ExpenseSummaryItem[];
        }>("https://ai.rosmerta.dev/expense/api/expense/summary", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          params: {
            state_id: selectedStateId,
            year: selectedYear,
            month: selectedMonth,
          },
        });

        setModifiedBy(data.modified_by);
        setModifiedAt(data.modified_at);

        const updatedTable: Record<string, Record<string, number>> = {};
        const summaryMap: Record<number, ExpenseSummaryItem> = {};
        data.expense_heads.forEach((item) => {
          summaryMap[item.expense_head_id] = item;
        });

        expenseHeads.forEach((head) => {
          const key = `${head.name} - ${head.category}`;
          const row: Record<string, number> = {};

          if (summaryMap[head.id]) {
            const ecAmounts = summaryMap[head.id].ec_amounts;
            centers.forEach((center) => {
              const match = ecAmounts.find((ea) => ea.ec_id === center.id);
              row[center.name] = match ? match.amount : 0;
            });
          } else {
            centers.forEach((center) => {
              row[center.name] = 0;
            });
          }

          updatedTable[key] = row;
        });

        setTableData(updatedTable);
      } catch (err: any) {
        toast({ title: "Error fetching summary", description: err.message, variant: "destructive" });
      }
    };

    if (!isAddMode && centers.length && expenseHeads.length) {
      fetchSummary();
    }
  }, [selectedStateId, selectedYear, selectedMonth, centers, expenseHeads, isAddMode]);

  const updateCellValue = (category: string, center: string, value: number) => {
    setTableData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [center]: value },
    }));
  };

  const handleSave = async () => {
    const token = await validateAndProceed();
    if (!token || !selectedStateId) return;

    const expenses = [];

    try {
      for (const [category, amounts] of Object.entries(tableData)) {
        const head = expenseHeads.find((h) => `${h.name} - ${h.category}` === category);
        if (!head) continue;

        for (const [centerName, amount] of Object.entries(amounts)) {
          if (amount > 0) {
            const center = centers.find((c) => c.name === centerName);
            if (center) {
              const expenseEntry: any = {
                expense_head_id: head.id,
                ec_id: center.id,
                amount,
              };

              if (!isAddMode) {
                expenseEntry.is_new = newCategories.has(category);
              }

              expenses.push(expenseEntry);
            }
          }
        }
      }

      const body = {
        state_id: selectedStateId,
        year: selectedYear.toString(),
        month: selectedMonth,
        expenses,
      };

      const endpoint = isAddMode
        ? "https://ai.rosmerta.dev/expense/api/expense/create"
        : "https://ai.rosmerta.dev/expense/api/expense/edit";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to ${isAddMode ? "create" : "update"} expenses: ${errText}`);
      }

      toast({
        title: "Success",
        description: `Expenses ${isAddMode ? "created" : "updated"} successfully`,
      });

      setNewCategories(new Set());
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const getTotalForCategory = (cat: string) =>
    Object.values(tableData[cat] || {}).reduce((s, v) => s + v, 0);
  const getTotalForCenter = (name: string) =>
    Object.values(tableData).reduce((s, d) => s + (d[name] || 0), 0);
  const getGrandTotal = () =>
    Object.values(tableData).reduce(
      (t, d) => t + Object.values(d).reduce((s, v) => s + v, 0),
      0
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {isEditMode ? "Edit Expense Data" : isAddMode ? "Add Expense Data" : "Expense Data"} -{" "}
          {selectedState}, {selectedMonth} {selectedYear}
          {modifiedBy && modifiedAt && (
            <div className="text-sm font-normal text-muted-foreground mt-1">
              Last Updated: {modifiedBy} on {new Date(modifiedAt).toLocaleString()}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2">Category</th>
                {centers.map((c) => (
                  <th key={c.id} className="border p-2 text-center">
                    {c.name}
                  </th>
                ))}
                <th className="border p-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tableData).map(([category, values]) => (
                <tr key={category}>
                  <td className="border p-2 bg-muted/30 font-medium">{category}</td>
                  {centers.map((center) => (
                    <td key={center.id} className="border p-1 text-center">
                      {isViewMode ? (
                        <div className="text-center">₹{values[center.name] || 0}</div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-gray-600">₹</span>
                          <Input
                            type="number"
                            min="0"
                            value={values[center.name] === 0 ? "" : values[center.name]}
                            placeholder="0"
                            onFocus={(e) => {
                              if (e.target.value === "0") e.target.select();
                            }}
                            onBlur={(e) => {
                              if (e.target.value === "") updateCellValue(category, center.name, 0);
                            }}
                            onChange={(e) =>
                              updateCellValue(category, center.name, parseFloat(e.target.value || "0"))
                            }
                            className={`text-center px-2 w-20 ${
                              values[center.name] === 0 ? "text-gray-400" : "text-black"
                            }`}
                          />
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="border p-2 text-center bg-accent/10">
                    ₹{getTotalForCategory(category)}
                  </td>
                </tr>
              ))}
              <tr className="bg-accent/20 font-semibold">
                <td className="border p-2">Total</td>
                {centers.map((center) => (
                  <td key={center.id} className="border p-2 text-center">
                    ₹{getTotalForCenter(center.name)}
                  </td>
                ))}
                <td className="border p-2 text-center bg-accent/30 text-lg">
                  ₹{getGrandTotal()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {(isEditMode || isEditingEnabled || isAddMode) && (
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>
              {isEditMode ? "Update Expenses" : "Save Expenses"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
