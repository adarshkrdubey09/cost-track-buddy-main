import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseTable } from "@/components/ExpenseTable";
import { INDIAN_STATES } from "@/types/expense";
import { useToast } from "@/hooks/use-toast";

export default function ViewExpenses() {
  const [formData, setFormData] = useState({
    state: "",
    month: "",
    year: new Date().getFullYear(),
  });
  const [showTable, setShowTable] = useState(false);
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years = Array.from({length: 10}, (_, i) => currentYear - 9 + i);
  
  // Filter months to not allow future months for current year
  const getAvailableMonths = () => {
    if (formData.year === currentYear) {
      return months.slice(0, currentMonth + 1);
    }
    return months;
  };

  useEffect(() => {
    // Check if user is authenticated
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const handleProceed = () => {
    // Validate required fields
    if (!formData.state || !formData.month) {
      toast({
        title: "Validation Error",
        description: "Please select state, month and year",
        variant: "destructive",
      });
      return;
    }
    
    setShowTable(true);
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (showTable) {
    return (
      <Layout>
        <div className="space-y-4 lg:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">View Expense Data</h1>
              <p className="text-sm sm:text-base text-muted-foreground">View and edit expense amounts in the table below</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {!isEditingEnabled ? (
                <Button 
                  onClick={() => setIsEditingEnabled(true)}
                  className="sm:order-1"
                >
                  Edit
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingEnabled(false)}
                  className="sm:order-1"
                >
                  Cancel Edit
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowTable(false)}
                className="sm:order-2"
              >
                Back to Selection
              </Button>
            </div>
          </div>

          <ExpenseTable
            selectedState={formData.state}
            selectedMonth={formData.month}
            selectedYear={formData.year}
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">View Expenses</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Select period details to view expense data</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select onValueChange={(value) => handleSelectChange("state", value)} value={formData.state}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select onValueChange={(value) => handleSelectChange("month", value)} value={formData.month}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableMonths().map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="year">Year</Label>
                  <Select onValueChange={(value) => handleSelectChange("year", parseInt(value))} value={formData.year.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={handleProceed} className="flex-1">
                  View Expenses
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