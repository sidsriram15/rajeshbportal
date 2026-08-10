"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { Student } from "@/lib/types";

export function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
}: {
  student: Student;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { deleteStudent } = useStore();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="sm">
        <DialogBody className="space-y-2 pt-5">
          <h2 className="text-[13px] font-semibold text-ink">Delete {student.name}?</h2>
          <p className="text-xs leading-relaxed text-muted">
            This will remove the student, their access, and associated private data.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="solidDanger"
            onClick={() => {
              deleteStudent(student.id);
              onOpenChange(false);
              router.push("/teacher/students");
            }}
          >
            Delete student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
