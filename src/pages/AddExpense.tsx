import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { State } from "@/types/State";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 9 + i);

  // Check authentication
  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Fetch states from API
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
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      
      setFormData((prev) => ({ ...prev, file }));
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
      setUploading(true);
      setUploadProgress(30);
      
      const token = localStorage.getItem("access_token");
      const uploadData = new FormData();

      // Convert month to two-digit format
      const monthIndex = months.indexOf(formData.month) + 1;
      const formattedMonth = monthIndex.toString().padStart(2, "0");

      uploadData.append("state", formData.stateShort);
      uploadData.append("month", formattedMonth);
      uploadData.append("year", formData.year.toString());
      uploadData.append("file", formData.file);

      setUploadProgress(60);
      // debugger
      const res = await fetch("https://ai.rosmerta.dev/expense/api/ingest/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      setUploadProgress(90);

      if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));

        if(res.status==400){
              throw new Error(errorData.detail || "Upload failed");

        }
    else{
        console.log(errorData.detail)
        throw new Error(errorData.message || "Upload failed");}
      }

      setUploadProgress(100);
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      // Navigate after a brief delay to show success
      setTimeout(() => navigate("/home"), 1000);
    } catch (err: any) {
      setUploading(false);
      setUploadProgress(0);
      toast({
        title: "Error",
        description: err.message || "File upload failed",
        variant: "destructive",
      });
    }
  };

  const handleProceed = () => {
    if (!formData.state || !formData.month || !formData.year) {
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-medium">Upload Expense Data</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Upload your expense data for {formData.state} - {formData.month} {formData.year}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload your expense data using the predefined Excel template.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="file">Excel File</Label>
                <Input 
                  id="file" 
                  type="file" 
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: .xlsx, .xls
                </p>
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <Label>Uploading... {uploadProgress}%</Label>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  onClick={handleUpload} 
                  disabled={!formData.file || uploading}
                  className="flex-1"
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                  className="flex-1"
                >
                  Back to Selection
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl  text-foreground font-medium">Add New Expense</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Select period details to add expense data
          </p>
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
                  <Select 
                    onValueChange={(value) => handleSelectChange("state", value)} 
                    value={formData.state}
                    disabled={loadingStates}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingStates ? "Loading states..." : "Select state"} />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange("month", value)} 
                    value={formData.month}
                  >
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
                  <Select 
                    onValueChange={(value) => handleSelectChange("year", parseInt(value))} 
                    value={formData.year.toString()}
                  >
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
                <Button 
                  onClick={handleProceed} 
                  className="flex-1"
                  disabled={loadingStates}
                >
                  Proceed to Upload
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