import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExpenseTable } from "@/components/ExpenseTable";
import { useToast } from "@/hooks/use-toast";
import { State } from "@/types/State";

interface ExcludedMonth {
  year: string;
  month: string;
}

// 🔐 Check token validity using HEAD method
const checkAuth = async (navigate: Function) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    localStorage.clear();
    navigate("/login");
    return false;
  }

  try {
    const res = await fetch("https://ai.rosmerta.dev/expense/api/auth/check", {
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      localStorage.clear();
      navigate("/login");
      return false;
    }

    return true;
  } catch {
    localStorage.clear();
    navigate("/login");
    return false;
  }
};

export default function AddExpense() {
  const [formData, setFormData] = useState({
    state: "",
    stateId: null,
    month: "",
    year: new Date().getFullYear(),
  });

  const [states, setStates] = useState<State[]>([]);
  const [excludedMonths, setExcludedMonths] = useState<ExcludedMonth[]>([]);
  const [loadingStates, setLoadingStates] = useState<boolean>(true);
  const [showTable, setShowTable] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => 2000 + i).filter(
    (y) => y <= currentYear
  );

  const getAvailableMonths = () => {
    const allMonths = formData.year === currentYear
      ? months.slice(0, currentMonth + 1)
      : months;

    const usedMonths = excludedMonths
      .filter((m) => parseInt(m.year) === formData.year)
      .map((m) => m.month);

    return allMonths.filter((month) => !usedMonths.includes(month));
  };

  useEffect(() => {
    checkAuth(navigate); // ✅ Initial auth check
  }, [navigate]);

  useEffect(() => {
    const fetchStates = async () => {
      const isValid = await checkAuth(navigate);
      if (!isValid) return;

      try {
        const access_token = localStorage.getItem("access_token");
        const res = await fetch("https://ai.rosmerta.dev/expense/api/states/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch states");

        const data: State[] = await res.json();
        setStates(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [navigate]);

  useEffect(() => {
    const fetchExcludedMonths = async () => {
      if (!formData.stateId) return;

      const isValid = await checkAuth(navigate);
      if (!isValid) return;

      try {
        const access_token = localStorage.getItem("access_token");
        const res = await fetch(
          `https://ai.rosmerta.dev/expense/api/expense/available-months/${formData.stateId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch excluded months");

        const data: ExcludedMonth[] = await res.json();
        setExcludedMonths(data);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to load months",
          variant: "destructive",
        });
      }
    };

    fetchExcludedMonths();
  }, [formData.stateId, navigate]);

  const handleSelectChange = (name: string, value: string | number) => {
    if (name === "state") {
      const selectedState = states.find((s) => s.name === value);
      setFormData((prev) => ({
        ...prev,
        state: value as string,
        stateId: selectedState?.id || null,
      }));
      setExcludedMonths([]);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
const handleProceed = () => {
  const primaryMissing: string[] = [];

  // Step 1: Check state and month first
  if (!formData.state) primaryMissing.push("state");
  if (!formData.month) primaryMissing.push("month");

  if (primaryMissing.length > 0) {
    toast({
      title: "Validation Error",
      description: `Please select ${primaryMissing.join(", ")}.`,
      variant: "destructive",
    });
    return;
  }

  // Step 2: Check year
  if (!formData.year) {
    toast({
      title: "Validation Error",
      description: "Please select year.",
      variant: "destructive",
    });
    return;
  }

  // Step 3: Check stateId (optional if it's needed)
  if (!formData.stateId) {
    toast({
      title: "Validation Error",
      description: "State ID is missing.",
      variant: "destructive",
    });
    return;
  }

  // All checks passed
  setShowTable(true);
};

  if (showTable) {
    return (
      <Layout>
        <div className="space-y-6 p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Add Expense Data</h1>
              <p className="text-muted-foreground">Enter expense amounts in the table below</p>
            </div>
            <Button variant="outline" onClick={() => setShowTable(false)}>
              Back to Selection
            </Button>
          </div>

          <ExpenseTable
            selectedState={formData.state}
            selectedStateId={formData.stateId}
            selectedMonth={formData.month}
            selectedYear={formData.year}
            isAddMode={true}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Add New Expense</h1>
          <p className="text-muted-foreground">Select period details to add expense data</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Period Selection</CardTitle>
            <CardDescription>
              Choose the state and date for your expense data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State</Label>
                  <select
                    className="w-full border rounded p-2"
                    onChange={(e) => handleSelectChange("state", e.target.value)}
                    value={formData.state}
                  >
                    <option disabled value="">
                      {loadingStates ? "Loading states..." : "Select state"}
                    </option>
                    {states.map((state) => (
                      <option key={state.id} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Year</Label>
                  <select
                    className="w-full border rounded p-2"
                    onChange={(e) => handleSelectChange("year", parseInt(e.target.value))}
                    value={formData.year}
                  >
                    <option value="" disabled>Select year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="block mb-2">Month</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {getAvailableMonths().length > 0 ? (
                    getAvailableMonths().map((month) => (
                      <button
                        key={month}
                        className={`rounded border px-3 py-2 text-sm transition ${
                          formData.month === month
                            ? "bg-primary text-white"
                            : "bg-muted hover:bg-muted-foreground/10"
                        }`}
                        onClick={() => handleSelectChange("month", month)}
                        type="button"
                      >
                        {month}
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground col-span-full">
                      No available months for this year
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button onClick={handleProceed} className="flex-1">
                  Proceed to Add Expenses
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/home")}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
