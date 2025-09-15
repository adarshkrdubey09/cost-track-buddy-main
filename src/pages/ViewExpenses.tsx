import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { ExpenseTable } from "@/components/ExpenseTable";
import { useToast } from "@/hooks/use-toast";
import { State } from "@/types/State";

interface AvailableMonth {
  year: string;
  month: string;
}

// 🔒 Centralized auth + redirect
const validateAndProceed = async (navigate: any): Promise<string | null> => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    clearSessionAndRedirect(navigate);
    return null;
  }

  try {
    const res = await fetch("https://ai.rosmerta.dev/expense/api/auth/check", {
      method: "HEAD",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 200) {
      clearSessionAndRedirect(navigate);
      return null;
    }
    return token;
  } catch {
    clearSessionAndRedirect(navigate);
    return null;
  }
};

const clearSessionAndRedirect = (navigate: any) => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("userloginname");
  localStorage.removeItem("userfirstname");
  localStorage.removeItem("userlastname");
  localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("sessionExpired")

  navigate("/login");
};

export default function ViewExpenses() {
  const [availableDates, setAvailableDates] = useState<AvailableMonth[]>([]);
  const [formData, setFormData] = useState({
    state: "",
    month: "",
    year: new Date().getFullYear(),
  });
  const [states, setStates] = useState<State[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      await validateAndProceed(navigate);
    })();
  }, [navigate]);

  useEffect(() => {
    const loadStates = async () => {
      const token = await validateAndProceed(navigate);
      if (!token) return;
      try {
        const res = await fetch("https://ai.rosmerta.dev/expense/api/states/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch states");
        const data = await res.json();
        setStates(data.sort((a: State, b: State) => a.name.localeCompare(b.name)));
      } catch (err: any) {
        toast({ title: "Error fetching states", description: err.message, variant: "destructive" });
      }
    };
    loadStates();
  }, []);

  useEffect(() => {
    const determineStateId = async () => {
      if (!formData.state) {
        setSelectedStateId(null);
        return;
      }
      const token = await validateAndProceed(navigate);
      if (!token) return;
      try {
        const res = await fetch("https://ai.rosmerta.dev/expense/api/states/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch states");
        const all = await res.json();
        const match = all.find((s: State) => s.name === formData.state);
        if (!match) throw new Error("Selected state not found");
        setSelectedStateId(String(match.id));
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    };
    determineStateId();
  }, [formData.state]);

  useEffect(() => {
    const loadMonths = async () => {
      if (!selectedStateId) return;
      const token = await validateAndProceed(navigate);
      if (!token) return;
      try {
        const res = await fetch(
          `https://ai.rosmerta.dev/expense/api/expense/available-months/${selectedStateId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch months");
        const data = await res.json();
        setAvailableDates(data);

        if (data.length > 0) {
          const latest = data.sort((a, b) => parseInt(b.year) - parseInt(a.year))[0];
          setFormData((prev) => ({
            ...prev,
            year: parseInt(latest.year),
            month: latest.month,
          }));
        }
      } catch (err: any) {
        toast({ title: "Error fetching months", description: err.message, variant: "destructive" });
      }
    };
    loadMonths();
  }, [selectedStateId]);

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getAvailableYears = () =>
    Array.from(new Set(availableDates.map((d) => d.year))).sort();
  const monthOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const getAvailableMonthsForSelectedYear = () =>
    availableDates
      .filter((d) => parseInt(d.year) === formData.year)
      .map((d) => d.month)
      .sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
const handleProceed = () => {
  // Step 1: Validate state
  if (!formData.state) {
    toast({
      title: "Validation Error",
      description: "Please select state.",
      variant: "destructive",
    });
    return;
  }

  // Step 2: Collect any missing fields for month and year
  const missingFields: string[] = [];
  if (!formData.month) missingFields.push("month");
  if (!formData.year) missingFields.push("year");

  // Step 3: Show toast if any of those fields are missing
  if (missingFields.length > 0) {
    toast({
      title: "Validation Error",
      description: `Please select ${missingFields.join(", ")}.`,
      variant: "destructive",
    });
    return;
  }

  // All fields are valid
  setShowTable(true);
};


  if (showTable && selectedStateId) {
    return (
      <Layout>
        <div className="space-y-6 px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-medium">View Expense Data</h1>
              <p className="text-muted-foreground">View & edit expense amounts in the table</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isEditingEnabled ? (
                <Button onClick={() => setIsEditingEnabled(true)}>Edit</Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditingEnabled(false)}>Cancel Edit</Button>
              )}
              <Button variant="outline" onClick={() => setShowTable(false)}>Back</Button>
            </div>
          </div>

          <ExpenseTable
            selectedState={formData.state}
            selectedStateId={selectedStateId}
            selectedYear={formData.year}
            selectedMonth={formData.month}
            isViewMode={!isEditingEnabled}
            isEditingEnabled={isEditingEnabled}
            onEditToggle={() => setIsEditingEnabled(false)}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl  text-foreground font-medium">View Expenses</h1>
          <p className="text-muted-foreground">Select period details to view data</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Period Selection</CardTitle>
            <CardDescription>Select state and date for expense data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(v) => handleSelectChange("state", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(v) => handleSelectChange("year", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 overflow-y-auto">
                      {getAvailableYears().map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="mb-1 block">Month</Label>
                  {getAvailableMonthsForSelectedYear().length === 0 ? (
                    <div className="text-muted-foreground text-sm">No months available</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {getAvailableMonthsForSelectedYear().map((m) => (
                        <button
                          key={m}
                          onClick={() => handleSelectChange("month", m)}
                          type="button"
                          className={`rounded border px-3 py-2 text-sm transition ${
                            formData.month === m
                              ? "bg-primary text-white"
                              : "bg-muted hover:bg-muted-foreground/10"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={handleProceed} className="flex-1">View Expenses</Button>
                <Button variant="outline" onClick={() => navigate("/home")} className="flex-1">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
