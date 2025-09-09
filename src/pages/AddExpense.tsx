import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { State } from "@/types/State";

export default function AddExpense() {
  const [formData, setFormData] = useState({
    state: "",
    stateShort: "",
    month: "",
    year: new Date().getFullYear(),
    file: null as File | null,
  });

  const [states, setStates] = useState<State[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loadingStates, setLoadingStates] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);

  // ✅ Get states from API
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("https://ai.rosmerta.dev/expense/api/states/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch states");

        const data: State[] = await res.json();
        setStates(data);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Could not load states",
          variant: "destructive",
        });
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [toast]);

  const getAvailableMonths = () => {
    if (formData.year === currentYear) {
      return months.slice(0, currentMonth + 1);
    }
    return months;
  };

  const handleSelectChange = (name: string, value: string | number) => {
    if (name === "state") {
      const selected = states.find((s) => s.name === value);
      setFormData((prev) => ({
        ...prev,
        state: selected?.name || "",
        stateShort: selected?.short_name || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleUpload = async () => {
    if (!formData.state || !formData.month || !formData.year || !formData.file) {
      toast({
        title: "Validation Error",
        description: "Please select state, month, year and upload file",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const uploadData = new FormData();

      // Convert month to two-digit format
      const monthIndex = months.indexOf(formData.month) + 1;
      const formattedMonth = monthIndex.toString().padStart(2, "0");

      uploadData.append("state", formData.stateShort);
      uploadData.append("month", formattedMonth);
      uploadData.append("year", formData.year.toString());
      uploadData.append("file", formData.file);

      const res = await fetch("https://ai.rosmerta.dev/expense/api/ingest/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      if (!res.ok) throw new Error("Upload failed");

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      navigate("/home");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "File upload failed",
        variant: "destructive",
      });
    }
  };

  const handleProceed = () => {
    if (!formData.state || !formData.month) {
      toast({
        title: "Validation Error",
        description: "Please select state, month and year",
        variant: "destructive",
      });
      return;
    }
    setShowUpload(true);
  };

  if (showUpload) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Upload Expense Data</h1>
          <p className="mb-6 text-muted-foreground">
            Upload your expense data for {formData.state} - {formData.month} {formData.year}
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Upload the Excel file in the correct format.</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="mb-4"
              />
              <div className="flex gap-4">
                <Button onClick={handleUpload} disabled={!formData.file}>
                  Upload
                </Button>
                <Button variant="outline" onClick={() => setShowUpload(false)}>
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Add New Expense</h1>
        <p className="mb-6 text-muted-foreground">
          Select period details to add expense data
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Period Selection</CardTitle>
            <CardDescription>Select state, month and year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>State</Label>
                <Select onValueChange={(val) => handleSelectChange("state", val)} value={formData.state}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingStates ? "Loading..." : "Select state"} />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Month</Label>
                <Select onValueChange={(val) => handleSelectChange("month", val)} value={formData.month}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableMonths().map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Year</Label>
                <Select onValueChange={(val) => handleSelectChange("year", parseInt(val))} value={formData.year.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleProceed} className="flex-1">
                Proceed to Upload
              </Button>
              <Button variant="outline" onClick={() => navigate("/home")} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
