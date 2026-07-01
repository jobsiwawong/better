"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { importData } from "@/app/actions/data-transfer";

export function ExportMenu() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      await importData(text);
      toast.success("Data imported successfully");
      router.refresh();
    } catch {
      toast.error("Import failed — check the file is a valid Better export.");
    }
    e.target.value = "";
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Download className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Export / import data</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href="/api/export/json" download>
              <FileJson className="size-3.5" /> Export as JSON
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/api/export/csv" download>
              <FileSpreadsheet className="size-3.5" /> Export tasks as CSV
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-3.5" /> Import JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        className="hidden"
      />
    </>
  );
}
