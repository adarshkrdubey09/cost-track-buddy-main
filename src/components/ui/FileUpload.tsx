import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText } from "lucide-react";

interface FileUploadProps {
  selectedState: string;
  selectedMonth: string;
  selectedYear: number;
  onBack: () => void;
}

export const FileUpload = ({ selectedState, selectedMonth, selectedYear, onBack }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('state', selectedState);
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear.toString());

      const response = await fetch('/api/expenses/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Upload Successful",
        description: `Successfully uploaded expense data for ${selectedState} - ${selectedMonth} ${selectedYear}`,
      });

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a simple Excel template download
    const link = document.createElement('a');
    link.href = '/template/expense-template.xlsx'; // This would need to be provided
    link.download = `expense-template-${selectedState}-${selectedMonth}-${selectedYear}.xlsx`;
    link.click();
    
    toast({
      title: "Template Download",
      description: "If the download doesn't start automatically, please contact support for the template.",
    });
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select Excel File</Label>
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="shrink-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={onBack}
          disabled={isUploading}
          className="flex-1"
        >
          Back to Selection
        </Button>
      </div>
    </div>
  );
};